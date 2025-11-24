using System;
using System.Collections.Generic;
using VCareer.Constants.PaymentVNPay;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Order
{
    public class Order : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; } // UserId của người mua (có thể là recruiter hoặc candidate)
        public string OrderCode { get; set; } // Mã đơn hàng (VD: ORD-20241225123456)
        public decimal SubTotal { get; set; } // Tổng tiền chưa VAT
        public decimal VATAmount { get; set; } // Tiền VAT
        public decimal TotalAmount { get; set; } // Tổng tiền thanh toán (đã bao gồm VAT)
        public string? DiscountCode { get; set; } // Mã giảm giá (nếu có)
        public decimal? DiscountAmount { get; set; } // Số tiền giảm giá
        public OrderStatus Status { get; set; } // Trạng thái đơn hàng
        public PaymentStatus PaymentStatus { get; set; } // Trạng thái thanh toán
        public PaymentMethod PaymentMethod { get; set; } // Phương thức thanh toán
        public string? VnpayTransactionId { get; set; } // Mã giao dịch VNPay
        public string? VnpayResponseCode { get; set; } // Mã phản hồi từ VNPay
        public string? VnpayPaymentId { get; set; } // PaymentId từ VNPAY.NET library (dùng để tìm order khi callback)
        public DateTime? PaidAt { get; set; } // Thời gian thanh toán
        public string? Notes { get; set; } // Ghi chú

        // Navigation properties
        public virtual IdentityUser User { get; set; }
        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }
}

