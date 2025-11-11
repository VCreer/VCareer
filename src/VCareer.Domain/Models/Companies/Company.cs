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
        public string? CompanyCode { get; set; } // ko rõ mục đích để làm gì 
        public bool VerificationStatus { get; set; }
        public string? Description { get; set; }
        public string? HeadquartersAddress { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public bool Status { get; set; } = true;
        public int? CompanySize { get; set; }
        public int? IndustryId { get; set; }
        public int? FoundedYear { get; set; }
        public string? LogoUrl { get; set; }
        public string? LegalDocumentUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? CultureVideoUrl { get; set; }
        public DateTime? VerifyAt { get; set; }

        // Legal Information fields (gộp từ CompanyLegalInfo)
        public string TaxCode { get; set; }
        public string? BusinessLicenseNumber { get; set; }
        public DateTime? BusinessLicenseIssueDate { get; set; }
        public string? BusinessLicenseIssuePlace { get; set; }
        public string? LegalRepresentative { get; set; }

        // File URLs for legal documents
        public string? BusinessLicenseFile { get; set; } // Link file giấy phép kinh doanh
        public string? TaxCertificateFile { get; set; } // Link file giấy chứng nhận mã số thuế
        public string? RepresentativeIdCardFile { get; set; } // Link file CCCD người đại diện
        public string? OtherSupportFile { get; set; } // Link file phụ khác (ủy quyền, v.v.)

        // Legal verification status
        public string? LegalVerificationStatus { get; set; } // pending, approved, rejected
        public long? LegalReviewedBy { get; set; } // Admin duyệt
        public DateTime? LegalReviewedAt { get; set; } // Thời gian duyệt

        public ICollection<CompanyIndustry> CompanyIndustries { get; private set; }
        public ICollection<RecruiterProfile> RecruiterProfiles { get; private set; } = new List<RecruiterProfile>();
    }
}
