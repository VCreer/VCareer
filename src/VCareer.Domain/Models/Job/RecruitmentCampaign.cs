using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class RecruitmentCampaign : FullAuditedAggregateRoot<Guid>
    {
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public string? Description { get; set; }
        public Guid RecruiterId { get; set; }
        public int CompanyId { get; set; }

        public virtual ICollection<Job_Post> Job_Posts { get; set; } = new HashSet<Job_Post>();
        public virtual RecruiterProfile Recruiter { get; set; }
    }
}
