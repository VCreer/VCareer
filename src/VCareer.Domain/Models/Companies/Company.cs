using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Companies
{
    public class Company : FullAuditedAggregateRoot<int>
    {
        public string CompanyName { get; set; }
        public string CompanyCode { get; set; }
        public bool VerificationStatus { get; set; }
        public string Description { get; set; }
        public string HeadquartersAddress { get; set; }
        public string ContactEmail { get; set; }
        public string ContactPhone { get; set; }
        public bool Status { get; set; }
        public int CompanySize { get; set; }
        public int IndustryId { get; set; }
        public int FoundedYear { get; set; }
        public DateTime VerifyAt { get; set; }

        public ICollection<CompanyIndustry> CompanyIndustries { get; private set; }
        public ICollection<RecruiterProfile> RecruiterProfiles { get; private set; } = new List<RecruiterProfile>(); 
    }
}
