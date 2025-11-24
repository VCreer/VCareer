using System;
using VCareer.Models.Subcription;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Identity;

namespace VCareer.Models.Cart
{
    public class Cart : AggregateRoot<Guid>
    {
        public Guid UserId { get; set; } // UserId của người dùng
        public Guid SubscriptionServiceId { get; set; } // ID của dịch vụ subscription
        public int Quantity { get; set; } // Số lượng
        public DateTime CreationTime { get; set; } // Thời gian tạo (manual tracking)

        // Navigation properties
        public virtual IdentityUser User { get; set; }
        public virtual SubcriptionService SubscriptionService { get; set; }

        // Parameterless constructor for EF Core
        public Cart()
        {
            CreationTime = DateTime.UtcNow;
        }
    }
}

