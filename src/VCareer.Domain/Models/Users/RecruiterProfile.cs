using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Models.Companies;
using VCareer.Models.Job;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    public class RecruiterProfile : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public int CompanyId { get; set; }
        public string Email{ get; set; }
        public bool IsLead { get; set; }
        public bool Status { get; set; }
        public bool IsVerified { get; set; } = false;
       
        public RecruiterLevel RecruiterLevel { get; set; } = RecruiterLevel.Unverified;
        public long? QuotaUsedBytes { get; set; } 
        public long? MaxQuotaBytes { get; set; }

        //danh sách các jonPossting
        public virtual Company Company { get; set; }
        public virtual IdentityUser User { get; set; }
        public virtual ICollection<Job_Post> JobPostings { get; set; }
    }
}
