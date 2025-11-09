using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    public class CandidateProfile : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public string Email { get; set; }
        public DateTime DateOfbirth { get; set; }
        public bool Gender { get; set; }
        public string Location { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool Status { get; set; }
        public IdentityUser User { get; set; }
        public long QuotaUsedBytes { get; set; }
        public long MaxQuotaBytes { get; set; }
    }
}
