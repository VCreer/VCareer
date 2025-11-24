using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using VCareer.Dto.Order;
using VCareer.IServices.Order;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrderController : AbpControllerBase
    {
        private readonly IOrderAppService _orderAppService;
        private readonly IConfiguration _configuration;

        public OrderController(IOrderAppService orderAppService, IConfiguration configuration)
        {
            _orderAppService = orderAppService;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<OrderDto> CreateOrderAsync([FromBody] CreateOrderDto input)
        {
            return await _orderAppService.CreateOrderAsync(input);
        }

        [HttpGet("{id}")]
        public async Task<OrderDto> GetOrderAsync(Guid id)
        {
            return await _orderAppService.GetOrderAsync(id);
        }

        [HttpGet("my-orders")]
        public async Task<OrderListDto> GetMyOrdersAsync()
        {
            return await _orderAppService.GetMyOrdersAsync();
        }

        [HttpPost("vnpay/create-payment-url")]
        public async Task<VnpayPaymentResponseDto> CreateVnpayPaymentUrlAsync([FromBody] VnpayPaymentRequestDto input)
        {
            return await _orderAppService.CreateVnpayPaymentUrlAsync(input);
        }

        [HttpGet("vnpay/callback")]
        [HttpPost("vnpay/callback")]
        [AllowAnonymous] // VNPay will call this endpoint
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> HandleVnpayCallbackAsync()
        {
            try
            {
                // Parse all query parameters from VNPay
                var queryParams = Request.Query;
                
                // Check if this is a request from Angular (has Accept: application/json header) or from VNPay browser redirect
                var isJsonRequest = Request.Headers.ContainsKey("Accept") && 
                                   Request.Headers["Accept"].ToString().Contains("application/json");
                
                // Get all VNPay parameters as dictionary for validation
                var vnpayParams = new Dictionary<string, string>();
                foreach (var param in queryParams)
                {
                    if (param.Key.StartsWith("vnp_"))
                    {
                        vnpayParams[param.Key] = param.Value.ToString();
                    }
                }

                // Extract required fields for DTO
                var callbackDto = new VnpayCallbackDto
                {
                    vnp_TxnRef = queryParams["vnp_TxnRef"].ToString(),
                    vnp_ResponseCode = queryParams["vnp_ResponseCode"].ToString(),
                    vnp_TransactionNo = queryParams["vnp_TransactionNo"].ToString(),
                    vnp_Amount = queryParams["vnp_Amount"].ToString(),
                    vnp_SecureHash = queryParams["vnp_SecureHash"].ToString()
                };

                // Pass full params dictionary for validation
                var order = await _orderAppService.HandleVnpayCallbackAsync(callbackDto, vnpayParams);
                
                // If request is from Angular (JSON), return JSON response
                if (isJsonRequest)
                {
                    return Ok(order);
                }
                
                // Otherwise, redirect to Angular callback page (VNPay browser redirect)
                var angularUrl = _configuration["App:AngularUrl"] ?? "http://localhost:4200";
                var redirectUrl = $"{angularUrl}/recruiter/payment/callback?orderId={order.Id}&status={order.PaymentStatus}";
                
                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                //Logger.LogError(ex, "Error handling VNPay callback");
                
                // Check if this is a JSON request
                var isJsonRequest = Request.Headers.ContainsKey("Accept") && 
                                   Request.Headers["Accept"].ToString().Contains("application/json");
                
                if (isJsonRequest)
                {
                    return BadRequest(new { error = ex.Message });
                }
                
                // Otherwise redirect with error
                var angularUrl = _configuration["App:AngularUrl"] ?? "http://localhost:4200";
                return Redirect($"{angularUrl}/recruiter/payment/callback?error={Uri.EscapeDataString(ex.Message)}");
            }
        }
    }
}

