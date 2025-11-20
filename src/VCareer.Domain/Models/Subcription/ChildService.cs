using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using Volo.Abp.Domain.Entities.Auditing;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Models.Subcription
{
    public class ChildService : FullAuditedAggregateRoot<Guid>
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public ServiceAction Action { get; set; }
        public ServiceTarget Target { get; set; }
        public bool IsActive { get; set; }
        public bool IsLifeTime { get; set; } = false;
        public bool IsAutoActive { get; set; } = false;
        public int? TimeUsedLimit { get; set; }
        public int? DayDuration { get; set; }
        public int? Value { get; set; }

        public virtual ICollection<ChildService_SubcriptionService> childService_Subcriptions { get; set; } = new HashSet<ChildService_SubcriptionService>();

        public virtual ICollection<User_ChildService> user_ChildServices { get; set; } = new HashSet<User_ChildService>();
    }
}
