using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Subcription_Payment;
using Volo.Abp.Domain.Entities.Auditing;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Models.Subcription
{
    public class SubcriptionService : FullAuditedAggregateRoot<Guid>
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public SubcriptorTarget Target { get; set; }
        public SubcriptionStatus Status { get; set; }
        public decimal OriginalPrice { get; set; } // giá gốc , sau thêm giá thì chỉnh percent sale ơ bang price
        public bool IsLimited { get; set; } // giới hạn số lượng mua trong 1 khonảg thời gian của toàn bộ người dùng
        public bool IsBuyLimited { get; set; } // giới hạn số lượng mua của mỗi cá nhân
        public int TotalBuyEachUser { get; set; } // số lượng tối đa mua của mỗi cá nhân
        public bool IsActive { get; set; }
        public virtual ICollection<ChildService_SubcriptionService> ChildService_SubcriptionServices{ get; set; } = new List<ChildService_SubcriptionService>();
        public virtual ICollection<User_SubcriptionService> user_SubcriptionServices { get; set; } = new List<User_SubcriptionService>();
        public virtual ICollection<SubcriptionPrice> subcriptionPrices { get; set; } = new List<SubcriptionPrice>();

    }
}
