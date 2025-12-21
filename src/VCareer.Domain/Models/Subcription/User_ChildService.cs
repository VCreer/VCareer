using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Models.Subcription
{

    public class User_ChildService : FullAuditedAggregateRoot<Guid>
    {
        public Guid OwnerId { get; set; }
        public Guid UserActiveId { get; set; }
        public Guid UserSubcriptionId { get; set; } // để phân biệt với các dịch vụ con cùng id , nhưng mua khác lần 
        public Guid ChildServiceId { get; set; }
        public ChildServiceStatus Status { get; set; }
        public bool IsLifeTime { get; set; } // có vĩnh viễn ko 
        public bool IsLimitUsedTime { get; set; }  //giới hạn số lần dùng
        public bool IsPrimaryOwner { get; set; } // la thang nay mua hay là thằng dùng nhờ (dùng để hiện/tắt nút share và trace)
        public int? UsedTime { get; set; } //đã dùng bao nhiêu
        public int? TotalUsageLimit { get; set; }  //tổng lượt được phép dùng
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // liên kết đến abp user
        public virtual ChildService ChildService { get; set; }
        public virtual IdentityUser User { get; set; }
        public virtual ICollection<EffectingJobService> EffectingJobServices { get; set; }

    }
}
