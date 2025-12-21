using NSubstitute;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Constants.PaymentVNPay;
using VCareer.Dto.Order;
using VCareer.Dto.Subcriptions;
using VCareer.IServices.Cart;
using VCareer.IServices.Order;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Order;
using VCareer.Models.Subcription;
using VCareer.Services.Order;
using VCareer.Services.Payment;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Xunit;

namespace VCareer.Order;

public class OrderAppServiceTests
{
    /// Test tạo order thành công khi input hợp lệ
    [Fact]
    public async Task CreateOrderAsync_creates_order_successfully()
    {
        // Arrange: Tạo dữ liệu test
        var currentUserId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();
        var subscriptionService = CreateSubscriptionService(serviceId, "Test Service", true, 100000);
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>
            {
                new CreateOrderDetailDto
                {
                    SubcriptionServiceId = serviceId,
                    Quantity = 2
                }
            },
            Notes = "Test order"
        };

        var (service, orderRepo) = BuildService(
            currentUserId,
            new List<Models.Order.Order>(),
            new List<OrderDetail>(),
            new List<SubcriptionService> { subscriptionService });

        // Act: Gọi hàm tạo order
        var result = await service.CreateOrderAsync(dto);

        // Assert: Kiểm tra order đã được tạo
        await orderRepo.Received(1).InsertAsync(
            Arg.Is<Models.Order.Order>(o => 
                o.UserId == currentUserId &&
                o.Status == OrderStatus.Pending &&
                o.PaymentStatus == PaymentStatus.Pending),
            Arg.Any<bool>());
        
        result.ShouldNotBeNull();
        result.TotalAmount.ShouldBe(200000); // 100000 * 2
    }

    /// Test tạo order thất bại khi user chưa đăng nhập
    [Fact]
    public async Task CreateOrderAsync_throws_when_user_not_authenticated()
    {
        // Arrange: Tạo service với user chưa đăng nhập
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>()
        };

        var (service, _) = BuildService(null, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>(), isAuthenticated: false);

        // Act & Assert: Kiểm tra ném exception khi user chưa đăng nhập
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(dto));

        ex.Message.ShouldContain("not authenticated");
    }

    /// Test tạo order thất bại khi input null
    [Fact]
    public async Task CreateOrderAsync_throws_when_input_null()
    {
        // Arrange: Tạo service với input null
        var currentUserId = Guid.NewGuid();
        var (service, _) = BuildService(currentUserId, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi input null
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(null));

        ex.Message.ShouldContain("cannot be empty");
    }

    /// Test tạo order thất bại khi OrderDetails rỗng
    [Fact]
    public async Task CreateOrderAsync_throws_when_order_details_empty()
    {
        // Arrange: Tạo dto với OrderDetails rỗng
        var currentUserId = Guid.NewGuid();
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>()
        };

        var (service, _) = BuildService(currentUserId, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi OrderDetails rỗng
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(dto));

        ex.Message.ShouldContain("cannot be empty");
    }

    /// Test tạo order thất bại khi SubscriptionServiceId rỗng
    [Fact]
    public async Task CreateOrderAsync_throws_when_subscription_service_id_empty()
    {
        // Arrange: Tạo dto với SubscriptionServiceId rỗng
        var currentUserId = Guid.NewGuid();
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>
            {
                new CreateOrderDetailDto
                {
                    SubcriptionServiceId = Guid.Empty,
                    Quantity = 1
                }
            }
        };

        var (service, _) = BuildService(currentUserId, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi SubscriptionServiceId rỗng
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(dto));

        ex.Message.ShouldContain("Invalid subscription service ID");
    }

    /// Test tạo order thất bại khi Quantity <= 0
    [Fact]
    public async Task CreateOrderAsync_throws_when_quantity_invalid()
    {
        // Arrange: Tạo dto với Quantity <= 0
        var currentUserId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>
            {
                new CreateOrderDetailDto
                {
                    SubcriptionServiceId = serviceId,
                    Quantity = 0
                }
            }
        };

        var (service, _) = BuildService(currentUserId, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi Quantity <= 0
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(dto));

        ex.Message.ShouldContain("Quantity must be greater than 0");
    }

    /// Test tạo order thất bại khi subscription service không tồn tại
    [Fact]
    public async Task CreateOrderAsync_throws_when_subscription_service_not_found()
    {
        // Arrange: Tạo dto với service không tồn tại
        var currentUserId = Guid.NewGuid();
        var nonExistentServiceId = Guid.NewGuid();
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>
            {
                new CreateOrderDetailDto
                {
                    SubcriptionServiceId = nonExistentServiceId,
                    Quantity = 1
                }
            }
        };

        var (service, _) = BuildService(currentUserId, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi service không tồn tại
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(dto));

        ex.Message.ShouldContain("not found");
    }

    /// Test tạo order thất bại khi subscription service không active
    [Fact]
    public async Task CreateOrderAsync_throws_when_subscription_service_inactive()
    {
        // Arrange: Tạo service không active
        var currentUserId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();
        var inactiveService = CreateSubscriptionService(serviceId, "Inactive Service", false, 100000);
        var dto = new CreateOrderDto
        {
            OrderDetails = new List<CreateOrderDetailDto>
            {
                new CreateOrderDetailDto
                {
                    SubcriptionServiceId = serviceId,
                    Quantity = 1
                }
            }
        };

        var (service, _) = BuildService(
            currentUserId,
            new List<Models.Order.Order>(),
            new List<OrderDetail>(),
            new List<SubcriptionService> { inactiveService });

        // Act & Assert: Kiểm tra ném exception khi service không active
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateOrderAsync(dto));

        ex.Message.ShouldContain("not active");
    }

    /// Test lấy order thành công khi order tồn tại và user hợp lệ
    [Fact]
    public async Task GetOrderAsync_returns_order_successfully()
    {
        // Arrange: Tạo order
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var order = CreateOrder(orderId, userId, OrderStatus.Pending, PaymentStatus.Pending);
        var orderDetail = CreateOrderDetail(Guid.NewGuid(), orderId, Guid.NewGuid(), 1, 100000);
        var subscriptionService = CreateSubscriptionService(orderDetail.SubcriptionServiceId, "Test Service", true, 100000);

        var (service, _) = BuildService(
            userId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail> { orderDetail },
            new List<SubcriptionService> { subscriptionService });

        // Act: Gọi hàm lấy order
        var result = await service.GetOrderAsync(orderId);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Id.ShouldBe(orderId);
    }

    /// Test lấy order thất bại khi user không khớp
    [Fact]
    public async Task GetOrderAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo order của user khác
        var currentUserId = Guid.NewGuid();
        var orderOwnerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var order = CreateOrder(orderId, orderOwnerId, OrderStatus.Pending, PaymentStatus.Pending);

        var (service, _) = BuildService(
            currentUserId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.GetOrderAsync(orderId));

        ex.Message.ShouldContain("don't have permission");
    }

    /// Test lấy danh sách orders của user thành công
    [Fact]
    public async Task GetMyOrdersAsync_returns_orders_successfully()
    {
        // Arrange: Tạo nhiều orders
        var userId = Guid.NewGuid();
        var order1 = CreateOrder(Guid.NewGuid(), userId, OrderStatus.Pending, PaymentStatus.Pending);
        var order2 = CreateOrder(Guid.NewGuid(), userId, OrderStatus.Completed, PaymentStatus.Paid);

        var (service, _) = BuildService(
            userId,
            new List<Models.Order.Order> { order1, order2 },
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act: Gọi hàm lấy danh sách orders
        var result = await service.GetMyOrdersAsync();

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.Items.ShouldNotBeNull();
        result.TotalCount.ShouldBe(2);
    }

    /// Test lấy danh sách orders thất bại khi user chưa đăng nhập
    [Fact]
    public async Task GetMyOrdersAsync_throws_when_user_not_authenticated()
    {
        // Arrange: Tạo service với user chưa đăng nhập
        var (service, _) = BuildService(null, new List<Models.Order.Order>(), new List<OrderDetail>(), new List<SubcriptionService>(), isAuthenticated: false);

        // Act & Assert: Kiểm tra ném exception khi user chưa đăng nhập
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.GetMyOrdersAsync());

        ex.Message.ShouldContain("not authenticated");
    }

    /// Test tạo VNPay payment URL thành công
    [Fact]
    public async Task CreateVnpayPaymentUrlAsync_creates_payment_url_successfully()
    {
        // Arrange: Tạo order pending
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var order = CreateOrder(orderId, userId, OrderStatus.Pending, PaymentStatus.Pending);
        var input = new VnpayPaymentRequestDto { OrderId = orderId };

        var (service, orderRepo) = BuildService(
            userId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act: Gọi hàm tạo payment URL
        var result = await service.CreateVnpayPaymentUrlAsync(input);

        // Assert: Kiểm tra kết quả
        result.ShouldNotBeNull();
        result.PaymentUrl.ShouldNotBeNullOrEmpty();
        result.OrderCode.ShouldBe(order.OrderCode);
    }

    /// Test tạo VNPay payment URL thất bại khi user không khớp
    [Fact]
    public async Task CreateVnpayPaymentUrlAsync_throws_when_user_mismatch()
    {
        // Arrange: Tạo order của user khác
        var currentUserId = Guid.NewGuid();
        var orderOwnerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var order = CreateOrder(orderId, orderOwnerId, OrderStatus.Pending, PaymentStatus.Pending);
        var input = new VnpayPaymentRequestDto { OrderId = orderId };

        var (service, _) = BuildService(
            currentUserId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi user không khớp
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateVnpayPaymentUrlAsync(input));

        ex.Message.ShouldContain("don't have permission");
    }

    /// Test tạo VNPay payment URL thất bại khi order không ở trạng thái pending
    [Fact]
    public async Task CreateVnpayPaymentUrlAsync_throws_when_order_not_pending()
    {
        // Arrange: Tạo order đã paid
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var order = CreateOrder(orderId, userId, OrderStatus.Completed, PaymentStatus.Paid);
        var input = new VnpayPaymentRequestDto { OrderId = orderId };

        var (service, _) = BuildService(
            userId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi order không pending
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.CreateVnpayPaymentUrlAsync(input));

        ex.Message.ShouldContain("not in pending payment status");
    }

    /// Test xử lý VNPay callback thành công
    [Fact]
    public async Task HandleVnpayCallbackAsync_handles_callback_successfully()
    {
        // Arrange: Tạo order với PaymentId
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var paymentId = "test-payment-id";
        var order = CreateOrder(orderId, userId, OrderStatus.Pending, PaymentStatus.Pending);
        order.VnpayPaymentId = paymentId;

        var input = new VnpayCallbackDto
        {
            vnp_TxnRef = paymentId,
            vnp_ResponseCode = "00",
            vnp_TransactionNo = "12345678",
            vnp_Amount = "10000000",
            vnp_SecureHash = "valid-hash"
        };

        var (service, orderRepo) = BuildService(
            userId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act: Gọi hàm xử lý callback
        var result = await service.HandleVnpayCallbackAsync(input);

        // Assert: Kiểm tra order đã được cập nhật
        result.ShouldNotBeNull();
        result.Id.ShouldBe(orderId);
    }

    /// Test xử lý VNPay callback thất bại khi input null
    [Fact]
    public async Task HandleVnpayCallbackAsync_throws_when_input_null()
    {
        // Arrange: Tạo service với input null
        var userId = Guid.NewGuid();
        var (service, _) = BuildService(
            userId,
            new List<Models.Order.Order>(),
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi input null
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.HandleVnpayCallbackAsync(null));

        ex.Message.ShouldContain("Invalid callback data");
    }

    /// Test xử lý VNPay callback thất bại khi signature không hợp lệ
    [Fact]
    public async Task HandleVnpayCallbackAsync_throws_when_signature_invalid()
    {
        // Arrange: Tạo order và callback với signature không hợp lệ
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var paymentId = "test-payment-id";
        var order = CreateOrder(orderId, userId, OrderStatus.Pending, PaymentStatus.Pending);
        order.VnpayPaymentId = paymentId;

        var input = new VnpayCallbackDto
        {
            vnp_TxnRef = paymentId,
            vnp_ResponseCode = "00",
            vnp_TransactionNo = "12345678",
            vnp_Amount = "10000000",
            vnp_SecureHash = "invalid-hash"
        };

        var (service, _) = BuildService(
            userId,
            new List<Models.Order.Order> { order },
            new List<OrderDetail>(),
            new List<SubcriptionService>(),
            validateCallback: false); // Mock validate trả về false

        // Act & Assert: Kiểm tra ném exception khi signature không hợp lệ
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.HandleVnpayCallbackAsync(input));

        ex.Message.ShouldContain("Invalid payment callback signature");
    }

    /// Test xử lý VNPay callback thất bại khi order không tồn tại
    [Fact]
    public async Task HandleVnpayCallbackAsync_throws_when_order_not_found()
    {
        // Arrange: Tạo callback với order không tồn tại
        var userId = Guid.NewGuid();
        var input = new VnpayCallbackDto
        {
            vnp_TxnRef = "non-existent-payment-id",
            vnp_ResponseCode = "00",
            vnp_TransactionNo = "12345678",
            vnp_Amount = "10000000",
            vnp_SecureHash = "valid-hash"
        };

        var (service, _) = BuildService(
            userId,
            new List<Models.Order.Order>(),
            new List<OrderDetail>(),
            new List<SubcriptionService>());

        // Act & Assert: Kiểm tra ném exception khi order không tồn tại
        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
            service.HandleVnpayCallbackAsync(input));

        ex.Message.ShouldContain("not found");
    }

    // ========== Helper Methods ==========

    /// Tạo dữ liệu test cho Order
    private static Models.Order.Order CreateOrder(
        Guid id,
        Guid userId,
        OrderStatus status,
        PaymentStatus paymentStatus)
    {
        var order = new Models.Order.Order
        {
            UserId = userId,
            OrderCode = $"ORD-{DateTime.Now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
            SubTotal = 100000,
            VATAmount = 0,
            TotalAmount = 100000,
            Status = status,
            PaymentStatus = paymentStatus,
            PaymentMethod = PaymentMethod.VNPay
        };

        typeof(Models.Order.Order)
            .GetProperty("Id")?
            .SetValue(order, id);

        return order;
    }

    /// Tạo dữ liệu test cho OrderDetail
    private static OrderDetail CreateOrderDetail(
        Guid id,
        Guid orderId,
        Guid subscriptionServiceId,
        int quantity,
        decimal unitPrice)
    {
        var orderDetail = new OrderDetail
        {
            OrderId = orderId,
            SubcriptionServiceId = subscriptionServiceId,
            Quantity = quantity,
            UnitPrice = unitPrice,
            TotalPrice = unitPrice * quantity
        };

        typeof(OrderDetail)
            .GetProperty("Id")?
            .SetValue(orderDetail, id);

        return orderDetail;
    }

    /// Tạo dữ liệu test cho SubcriptionService
    private static SubcriptionService CreateSubscriptionService(
        Guid id,
        string title,
        bool isActive,
        decimal price)
    {
        var service = new SubcriptionService
        {
            Title = title,
            IsActive = isActive
        };

        typeof(SubcriptionService)
            .GetProperty("Id")?
            .SetValue(service, id);

        return service;
    }

    /// Tạo service test với các dependency giả (mock)
    private static (OrderAppService service, IRepository<Models.Order.Order, Guid> orderRepo) BuildService(
        Guid? currentUserId,
        List<Models.Order.Order> orderData,
        List<OrderDetail> orderDetailData,
        List<SubcriptionService> subscriptionServiceData,
        bool isAuthenticated = true,
        bool validateCallback = true)
    {
        // Tạo mock repository cho Order
        var orderRepo = Substitute.For<IRepository<Models.Order.Order, Guid>>();
        orderRepo.GetQueryableAsync()
            .Returns(Task.FromResult(orderData.AsQueryable()));
        orderRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var order = orderData.FirstOrDefault(o => o.Id == id);
                if (order == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(order);
            });
        orderRepo.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<Models.Order.Order, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<Models.Order.Order, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(orderData.Where(compiled).ToList());
            });
        orderRepo.InsertAsync(Arg.Any<Models.Order.Order>(), Arg.Any<bool>())
            .Returns(ci =>
            {
                var order = ci.Arg<Models.Order.Order>();
                orderData.Add(order);
                return Task.FromResult(order);
            });
        orderRepo.UpdateAsync(Arg.Any<Models.Order.Order>(), Arg.Any<bool>())
            .Returns(ci => Task.FromResult(ci.Arg<Models.Order.Order>()));

        // Tạo mock repository cho OrderDetail
        var orderDetailRepo = Substitute.For<IRepository<OrderDetail, Guid>>();
        orderDetailRepo.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<OrderDetail, bool>>>())
            .Returns(ci =>
            {
                var predicate = ci.Arg<System.Linq.Expressions.Expression<Func<OrderDetail, bool>>>();
                var compiled = predicate.Compile();
                return Task.FromResult(orderDetailData.Where(compiled).ToList());
            });
        orderDetailRepo.InsertAsync(Arg.Any<OrderDetail>(), Arg.Any<bool>())
            .Returns(ci =>
            {
                var detail = ci.Arg<OrderDetail>();
                orderDetailData.Add(detail);
                return Task.FromResult(detail);
            });

        // Tạo mock repository cho SubcriptionService
        var subscriptionServiceRepo = Substitute.For<IRepository<SubcriptionService, Guid>>();
        subscriptionServiceRepo.GetAsync(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var id = ci.Arg<Guid>();
                var service = subscriptionServiceData.FirstOrDefault(s => s.Id == id);
                if (service == null)
                    throw new EntityNotFoundException();
                return Task.FromResult(service);
            });

        // Tạo mock VnpayService
        var vnpayService = Substitute.For<IVnpayService>();
        vnpayService.CreatePaymentUrlWithId(Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<decimal>(), Arg.Any<string>())
            .Returns(("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "test-payment-id"));
        vnpayService.ValidatePaymentCallback(Arg.Any<Dictionary<string, string>>(), Arg.Any<string>())
            .Returns(validateCallback);

        // Tạo mock SubcriptionPriceService
        var subcriptionPriceService = Substitute.For<ISubcriptionPriceService>();
        subcriptionPriceService.GetCurrentPriceOfSubcription(Arg.Any<Guid>())
            .Returns(ci =>
            {
                var serviceId = ci.Arg<Guid>();
                var service = subscriptionServiceData.FirstOrDefault(s => s.Id == serviceId);
                return Task.FromResult(100000m); // Default price
            });

        // Tạo mock UserSubcriptionService
        var userSubcriptionService = Substitute.For<IUserSubcriptionService>();
        userSubcriptionService.BuySubcription(Arg.Any<User_SubcirptionCreateDto>())
            .Returns(Task.CompletedTask);

        // Tạo mock CartAppService
        var cartService = Substitute.For<ICartAppService>();
        cartService.ClearCartAsync()
            .Returns(Task.CompletedTask);

        // Tạo mock ICurrentUser
        var currentUser = Substitute.For<ICurrentUser>();
        currentUser.IsAuthenticated.Returns(isAuthenticated);
        if (isAuthenticated && currentUserId.HasValue)
        {
            currentUser.Id.Returns((Guid?)currentUserId.Value);
        }

        // Tạo mock IConfiguration
        var configuration = Substitute.For<Microsoft.Extensions.Configuration.IConfiguration>();
        configuration["App:SelfUrl"].Returns("https://localhost:44385");

        // Tạo mock ILogger
        var logger = Substitute.For<Microsoft.Extensions.Logging.ILogger<OrderAppService>>();

        // Tạo service với các dependency giả
        var service = new OrderAppService(
            orderRepo,
            orderDetailRepo,
            subscriptionServiceRepo,
            vnpayService,
            currentUser,
            configuration,
            userSubcriptionService,
            subcriptionPriceService,
            cartService,
            logger);

        return (service, orderRepo);
    }
}

