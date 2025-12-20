using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Order;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.Order
{
    public interface IOrderAppService : IApplicationService
    {
        Task<OrderViewDto> CreateOrderAsync(CreateOrderDto input);
        Task<OrderViewDto> GetOrderAsync(Guid id);
        Task<VnpayPaymentResponseDto> CreateVnpayPaymentUrlAsync(VnpayPaymentRequestDto input);
        Task<OrderViewDto> HandleVnpayCallbackAsync(VnpayCallbackDto input, Dictionary<string, string>? vnpayParams = null);
        Task<OrderListDto> GetMyOrdersAsync();
    }
}

