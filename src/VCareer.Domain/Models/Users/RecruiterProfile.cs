using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Companies;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    public class RecruiterProfile : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public int CompanyId { get; set; }
        public bool IsLead { get; set; }
        public bool Status { get; set; }
        public IdentityUser User { get; set; }
        public Company Company { get; set; }
        public long QuotaUsedBytes { get; set; } 
        public long MaxQuotaBytes { get; set; }
    }
}
