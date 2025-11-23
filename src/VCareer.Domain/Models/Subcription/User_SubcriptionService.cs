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
    public class User_SubcriptionService : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public Guid SubcriptionServiceId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public SubcriptionStatus status { get; set; }

        public virtual IdentityUser User { get; set; }
        public SubcriptionService SubcriptionService { get; set; }
    }
}
