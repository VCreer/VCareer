using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Order;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.Order
{
    public interface IOrderAppService : IApplicationService
    {
        Task<OrderDto> CreateOrderAsync(CreateOrderDto input);
        Task<OrderDto> GetOrderAsync(Guid id);
        Task<VnpayPaymentResponseDto> CreateVnpayPaymentUrlAsync(VnpayPaymentRequestDto input);
        Task<OrderDto> HandleVnpayCallbackAsync(VnpayCallbackDto input, Dictionary<string, string>? vnpayParams = null);
        Task<OrderListDto> GetMyOrdersAsync();
    }
}

