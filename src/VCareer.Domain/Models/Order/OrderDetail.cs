using System;
using VCareer.Models.Subcription;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Order
{
    public class OrderDetail : FullAuditedAggregateRoot<Guid>
    {
        public Guid OrderId { get; set; }
        public Guid SubcriptionServiceId { get; set; }
        public int Quantity { get; set; } // Số lượng
        public decimal UnitPrice { get; set; } // Đơn giá
        public decimal TotalPrice { get; set; } // Tổng tiền (UnitPrice * Quantity)
        public string? Notes { get; set; } // Ghi chú

        // Navigation properties
        public virtual Order Order { get; set; }
        public virtual SubcriptionService SubcriptionService { get; set; }
    }
}


