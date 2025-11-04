using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.CV;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    public class CandidateProfile : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public DateTime DateOfbirth { get; set; }
        public bool Gender { get; set; }
        public string Location { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool Status { get; set; }
        public IdentityUser User { get; set; }
        public long QuotaUsedBytes { get; set; }
        public long MaxQuotaBytes { get; set; }

        // === NAVIGATION PROPERTIES ===

        /// <summary>
        /// Danh sách CVs của candidate này
        /// </summary>
        public ICollection<CandidateCv>? CandidateCvs { get; set; }
    }
}
