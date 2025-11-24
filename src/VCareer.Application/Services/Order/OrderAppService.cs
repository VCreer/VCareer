using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VCareer.Constants.PaymentVNPay;
using VCareer.Dto.Order;
using VCareer.IServices.Order;
using VCareer.Services.Payment;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace VCareer.Services.Order
{
    [Authorize]
    [RemoteService(IsEnabled = true)]
    public class OrderAppService : ApplicationService, IOrderAppService
    {
        private readonly IRepository<Models.Order.Order, Guid> _orderRepository;
        private readonly IRepository<Models.Order.OrderDetail, Guid> _orderDetailRepository;
        private readonly IRepository<Models.Subcription.SubcriptionService, Guid> _subcriptionServiceRepository;
        private readonly IVnpayService _vnpayService;
        private readonly ICurrentUser _currentUser;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OrderAppService> _logger;
        private const decimal VAT_RATE = 0.08m; // 8% VAT

        public OrderAppService(
            IRepository<Models.Order.Order, Guid> orderRepository,
            IRepository<Models.Order.OrderDetail, Guid> orderDetailRepository,
            IRepository<Models.Subcription.SubcriptionService, Guid> subcriptionServiceRepository,
            IVnpayService vnpayService,
            ICurrentUser currentUser,
            IConfiguration configuration,
            ILogger<OrderAppService> logger)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _subcriptionServiceRepository = subcriptionServiceRepository;
            _vnpayService = vnpayService;
            _currentUser = currentUser;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderDto input)
        {
            try
            {
                if (!_currentUser.Id.HasValue)
                {
                    throw new UserFriendlyException("User not authenticated");
                }

                if (input == null || input.OrderDetails == null || input.OrderDetails.Count == 0)
                {
                    throw new UserFriendlyException("Order details cannot be empty");
                }

                var userId = _currentUser.Id.Value;

                // Validate and calculate order
                var orderDetails = new List<Models.Order.OrderDetail>();
                decimal subTotal = 0;

                foreach (var detailDto in input.OrderDetails)
                {
                    if (detailDto.SubcriptionServiceId == Guid.Empty)
                    {
                        throw new UserFriendlyException("Invalid subscription service ID");
                    }

                    if (detailDto.Quantity <= 0)
                    {
                        throw new UserFriendlyException("Quantity must be greater than 0");
                    }

                    var subscriptionService = await _subcriptionServiceRepository.GetAsync(detailDto.SubcriptionServiceId);
                    
                    if (subscriptionService == null)
                    {
                        throw new UserFriendlyException($"Subscription service not found: {detailDto.SubcriptionServiceId}");
                    }

                    if (!subscriptionService.IsActive)
                    {
                        throw new UserFriendlyException($"Subscription service {subscriptionService.Title} is not active");
                    }

                    var unitPrice = detailDto.UnitPrice ?? subscriptionService.OriginalPrice;
                    var totalPrice = unitPrice * detailDto.Quantity;

                    var orderDetail = new Models.Order.OrderDetail
                    {
                        SubcriptionServiceId = detailDto.SubcriptionServiceId,
                        Quantity = detailDto.Quantity,
                        UnitPrice = unitPrice,
                        TotalPrice = totalPrice
                    };

                    orderDetails.Add(orderDetail);
                    subTotal += totalPrice;
                }

                // Calculate VAT and total
                var vatAmount = subTotal * VAT_RATE;
                decimal? discountAmount = input.DiscountCode != null ? 0 : null; // TODO: Implement discount logic
                var totalAmount = subTotal + vatAmount - (discountAmount ?? 0);

                // Generate order code
                var orderCode = $"ORD-{DateTime.Now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

                // Create order
                var order = new Models.Order.Order
                {
                    UserId = userId,
                    OrderCode = orderCode,
                    SubTotal = subTotal,
                    VATAmount = vatAmount,
                    TotalAmount = totalAmount,
                    DiscountCode = input.DiscountCode,
                    DiscountAmount = discountAmount,
                    Status = OrderStatus.Pending,
                    PaymentStatus = PaymentStatus.Pending,
                    PaymentMethod = PaymentMethod.VNPay,
                    Notes = input.Notes
                };

                await _orderRepository.InsertAsync(order);

                // Create order details
                foreach (var detail in orderDetails)
                {
                    detail.OrderId = order.Id;
                    await _orderDetailRepository.InsertAsync(detail);
                }

                // Map to DTO
                var orderDto = ObjectMapper.Map<Models.Order.Order, OrderDto>(order);
                orderDto.OrderDetails = orderDetails.Select(d => new OrderDetailDto
                {
                    Id = d.Id,
                    OrderId = d.OrderId,
                    SubcriptionServiceId = d.SubcriptionServiceId,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    TotalPrice = d.TotalPrice,
                    Notes = d.Notes
                }).ToList();

                // Load subscription service titles
                foreach (var detailDto in orderDto.OrderDetails)
                {
                    var service = await _subcriptionServiceRepository.GetAsync(detailDto.SubcriptionServiceId);
                    detailDto.SubcriptionServiceTitle = service.Title;
                }

                return orderDto;
            }
            catch (UserFriendlyException)
            {
                throw; // Re-throw user-friendly exceptions as-is
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order for user {UserId}", _currentUser.Id);
                throw new UserFriendlyException($"Error creating order: {ex.Message}");
            }
        }

        public async Task<OrderDto> GetOrderAsync(Guid id)
        {
            var order = await _orderRepository.GetAsync(id);

            if (!_currentUser.Id.HasValue || order.UserId != _currentUser.Id.Value)
            {
                throw new UserFriendlyException("You don't have permission to view this order");
            }

            var orderDto = ObjectMapper.Map<Models.Order.Order, OrderDto>(order);

            // Load order details
            var details = await _orderDetailRepository.GetListAsync(d => d.OrderId == id);
            orderDto.OrderDetails = details.Select(d =>
            {
                var detailDto = ObjectMapper.Map<Models.Order.OrderDetail, OrderDetailDto>(d);
                return detailDto;
            }).ToList();

            // Load subscription service titles
            foreach (var detailDto in orderDto.OrderDetails)
            {
                var service = await _subcriptionServiceRepository.GetAsync(detailDto.SubcriptionServiceId);
                detailDto.SubcriptionServiceTitle = service.Title;
            }

            return orderDto;
        }

        public async Task<VnpayPaymentResponseDto> CreateVnpayPaymentUrlAsync(VnpayPaymentRequestDto input)
        {
            var order = await _orderRepository.GetAsync(input.OrderId);

            if (!_currentUser.Id.HasValue || order.UserId != _currentUser.Id.Value)
            {
                throw new UserFriendlyException("You don't have permission to pay for this order");
            }

            if (order.PaymentStatus != PaymentStatus.Pending)
            {
                throw new UserFriendlyException("Order is not in pending payment status");
            }

            var angularUrl = _configuration["App:AngularUrl"] ?? "http://localhost:4200";
            var returnUrl = $"{angularUrl}/recruiter/payment/callback";
            var (paymentUrl, paymentId) = _vnpayService.CreatePaymentUrlWithId(
                order.Id,
                order.OrderCode,
                order.TotalAmount,
                returnUrl
            );

            // Store PaymentId in Order for callback lookup
            // Note: VNPay may use PaymentId as vnp_TxnRef in callback, not the TxnRef we set
            order.VnpayPaymentId = paymentId;
            await _orderRepository.UpdateAsync(order);
            
            _logger.LogInformation("Payment URL created for Order {OrderId}, OrderCode: {OrderCode}, PaymentId: {PaymentId}", 
                order.Id, order.OrderCode, paymentId);

            return new VnpayPaymentResponseDto
            {
                PaymentUrl = paymentUrl,
                OrderCode = order.OrderCode
            };
        }

        public async Task<OrderDto> HandleVnpayCallbackAsync(VnpayCallbackDto input, Dictionary<string, string>? vnpayParams = null)
        {
            if (input == null || string.IsNullOrEmpty(input.vnp_TxnRef))
            {
                throw new UserFriendlyException("Invalid callback data");
            }

            // Use provided params or create from input
            var vnpayData = vnpayParams ?? new Dictionary<string, string>
            {
                { "vnp_TxnRef", input.vnp_TxnRef ?? "" },
                { "vnp_ResponseCode", input.vnp_ResponseCode ?? "" },
                { "vnp_TransactionNo", input.vnp_TransactionNo ?? "" },
                { "vnp_Amount", input.vnp_Amount ?? "" }
            };

            // Validate callback signature
            if (!string.IsNullOrEmpty(input.vnp_SecureHash))
            {
                if (!_vnpayService.ValidatePaymentCallback(vnpayData, input.vnp_SecureHash))
                {
                    _logger.LogWarning("Invalid payment callback signature for order {OrderCode}", input.vnp_TxnRef);
                    throw new UserFriendlyException("Invalid payment callback signature");
                }
            }

            // Find order by vnp_TxnRef
            // Try multiple methods: PaymentId (most likely), OrderId (Guid), or OrderCode
            Models.Order.Order? order = null;
            var orderQuery = await _orderRepository.GetQueryableAsync();
            
            _logger.LogInformation("Looking for order with TxnRef: {TxnRef}", input.vnp_TxnRef);
            
            // Method 1: Try to find by PaymentId first (VNPay returns PaymentId as TxnRef)
            order = orderQuery.FirstOrDefault(o => o.VnpayPaymentId == input.vnp_TxnRef);
            if (order != null)
            {
                _logger.LogInformation("Order found by PaymentId: {OrderId}, OrderCode: {OrderCode}", order.Id, order.OrderCode);
            }
            
            // Method 2: Try to parse as Guid (OrderId) if not found by PaymentId
            if (order == null && Guid.TryParse(input.vnp_TxnRef, out Guid orderId))
            {
                order = orderQuery.FirstOrDefault(o => o.Id == orderId);
                if (order != null)
                {
                    _logger.LogInformation("Order found by OrderId: {OrderId}, OrderCode: {OrderCode}", order.Id, order.OrderCode);
                }
            }
            
            // Method 3: Try to find by OrderCode (backward compatibility)
            if (order == null)
            {
                order = orderQuery.FirstOrDefault(o => o.OrderCode == input.vnp_TxnRef);
                if (order != null)
                {
                    _logger.LogInformation("Order found by OrderCode: {OrderId}, OrderCode: {OrderCode}", order.Id, order.OrderCode);
                }
            }
            
            if (order == null)
            {
                // Log all orders with PaymentId for debugging
                var ordersWithPaymentId = orderQuery.Where(o => !string.IsNullOrEmpty(o.VnpayPaymentId)).ToList();
                _logger.LogWarning("Order not found for TxnRef: {TxnRef}. Found {Count} orders with PaymentId. PaymentIds: {PaymentIds}", 
                    input.vnp_TxnRef, 
                    ordersWithPaymentId.Count,
                    string.Join(", ", ordersWithPaymentId.Select(o => o.VnpayPaymentId)));
                throw new UserFriendlyException($"Order not found. TxnRef: {input.vnp_TxnRef}");
            }

            // Update order status
            if (input.vnp_ResponseCode == "00") // Success
            {
                order.PaymentStatus = PaymentStatus.Paid;
                order.Status = OrderStatus.Processing;
                order.VnpayTransactionId = input.vnp_TransactionNo;
                order.VnpayResponseCode = input.vnp_ResponseCode;
                order.PaidAt = DateTime.Now;

                // TODO: Activate subscription services for the user
            }
            else
            {
                order.PaymentStatus = PaymentStatus.Failed;
                order.Status = OrderStatus.Failed;
                order.VnpayResponseCode = input.vnp_ResponseCode;
            }

            await _orderRepository.UpdateAsync(order);

            return await GetOrderAsync(order.Id);
        }

        public async Task<OrderListDto> GetMyOrdersAsync()
        {
            if (!_currentUser.Id.HasValue)
            {
                throw new UserFriendlyException("User not authenticated");
            }

            var userId = _currentUser.Id.Value;
            var orders = await _orderRepository.GetListAsync(o => o.UserId == userId);

            var orderDtos = new List<OrderDto>();
            foreach (var order in orders.OrderByDescending(o => o.CreationTime))
            {
                var orderDto = ObjectMapper.Map<Models.Order.Order, OrderDto>(order);
                
                // Load order details
                var details = await _orderDetailRepository.GetListAsync(d => d.OrderId == order.Id);
                orderDto.OrderDetails = details.Select(d =>
                {
                    var detailDto = ObjectMapper.Map<Models.Order.OrderDetail, OrderDetailDto>(d);
                    return detailDto;
                }).ToList();

                // Load subscription service titles
                foreach (var detailDto in orderDto.OrderDetails)
                {
                    var service = await _subcriptionServiceRepository.GetAsync(detailDto.SubcriptionServiceId);
                    detailDto.SubcriptionServiceTitle = service.Title;
                }

                orderDtos.Add(orderDto);
            }

            return new OrderListDto
            {
                Items = orderDtos,
                TotalCount = orderDtos.Count
            };
        }
    }
}

