using System;
using System.Collections.Generic;
using VCareer.Constants.PaymentVNPay;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Order
{
    public class OrderDto : FullAuditedEntityDto<Guid>
    {
        public Guid UserId { get; set; }
        public string OrderCode { get; set; }
        public decimal SubTotal { get; set; }
        public decimal VATAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string? DiscountCode { get; set; }
        public decimal? DiscountAmount { get; set; }
        public OrderStatus Status { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? VnpayTransactionId { get; set; }
        public string? VnpayResponseCode { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Notes { get; set; }
        public List<OrderDetailDto> OrderDetails { get; set; } = new List<OrderDetailDto>();
    }

    public class OrderDetailDto : FullAuditedEntityDto<Guid>
    {
        public Guid OrderId { get; set; }
        public Guid SubcriptionServiceId { get; set; }
        public string SubcriptionServiceTitle { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateOrderDto
    {
        public List<CreateOrderDetailDto> OrderDetails { get; set; } = new List<CreateOrderDetailDto>();
        public string? DiscountCode { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateOrderDetailDto
    {
        public Guid SubcriptionServiceId { get; set; }
        public int Quantity { get; set; }
        public decimal? UnitPrice { get; set; } // Optional, backend will use price from subscription service if not provided
    }

    public class OrderListDto : PagedResultDto<OrderDto>
    {
    }

    public class VnpayPaymentRequestDto
    {
        public Guid OrderId { get; set; }
    }

    public class VnpayPaymentResponseDto
    {
        public string PaymentUrl { get; set; }
        public string OrderCode { get; set; }
    }

    public class VnpayCallbackDto
    {
        public string vnp_TxnRef { get; set; } // OrderCode
        public string vnp_ResponseCode { get; set; }
        public string vnp_TransactionNo { get; set; }
        public string vnp_Amount { get; set; }
        public string vnp_SecureHash { get; set; }
    }
}

