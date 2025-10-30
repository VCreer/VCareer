using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.Profile
{
    public class SubmitCompanyLegalInfoDto
    {
        [Required]
        [StringLength(255)]
        public string CompanyName { get; set; }

        [StringLength(50)]
        public string CompanyCode { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        [StringLength(255)]
        public string HeadquartersAddress { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string ContactEmail { get; set; }

        [Required]
        [StringLength(20)]
        public string ContactPhone { get; set; }

        public int CompanySize { get; set; } = 1;
        public int IndustryId { get; set; } = 1;
        public int FoundedYear { get; set; } = DateTime.Now.Year;

        // Legal Information fields
        [Required]
        [StringLength(50)]
        public string TaxCode { get; set; }

        [Required]
        [StringLength(100)]
        public string BusinessLicenseNumber { get; set; }

        [Required]
        public DateTime BusinessLicenseIssueDate { get; set; }

        [Required]
        [StringLength(255)]
        public string BusinessLicenseIssuePlace { get; set; }

        [Required]
        [StringLength(255)]
        public string LegalRepresentative { get; set; }

        // File URLs (optional for initial submission)
        [StringLength(500)]
        public string BusinessLicenseFile { get; set; }

        [StringLength(500)]
        public string TaxCertificateFile { get; set; }

        [StringLength(500)]
        public string RepresentativeIdCardFile { get; set; }

        [StringLength(500)]
        public string OtherSupportFile { get; set; }
    }

    public class UpdateCompanyLegalInfoDto
    {
        [Required]
        [StringLength(255)]
        public string CompanyName { get; set; }

        [StringLength(50)]
        public string CompanyCode { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        [StringLength(255)]
        public string HeadquartersAddress { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string ContactEmail { get; set; }

        [Required]
        [StringLength(20)]
        public string ContactPhone { get; set; }

        public int CompanySize { get; set; }
        public int IndustryId { get; set; }
        public int FoundedYear { get; set; }

        // Legal Information fields
        [Required]
        [StringLength(50)]
        public string TaxCode { get; set; }

        [Required]
        [StringLength(100)]
        public string BusinessLicenseNumber { get; set; }

        [Required]
        public DateTime BusinessLicenseIssueDate { get; set; }

        [Required]
        [StringLength(255)]
        public string BusinessLicenseIssuePlace { get; set; }

        [Required]
        [StringLength(255)]
        public string LegalRepresentative { get; set; }

        // File URLs
        [StringLength(500)]
        public string BusinessLicenseFile { get; set; }

        [StringLength(500)]
        public string TaxCertificateFile { get; set; }

        [StringLength(500)]
        public string RepresentativeIdCardFile { get; set; }

        [StringLength(500)]
        public string OtherSupportFile { get; set; }
    }

    public class CompanyLegalInfoDto : EntityDto<int>
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
        public string LogoUrl { get; set; }
        public string LegalDocumentUrl { get; set; }
        public string CoverImageUrl { get; set; }
        public string WebsiteUrl { get; set; }
        public string CultureVideoUrl { get; set; }
        public DateTime VerifyAt { get; set; }
        
        // Legal Information fields
        public string TaxCode { get; set; }
        public string BusinessLicenseNumber { get; set; }
        public DateTime? BusinessLicenseIssueDate { get; set; }
        public string BusinessLicenseIssuePlace { get; set; }
        public string LegalRepresentative { get; set; }
        
        // File URLs for legal documents
        public string BusinessLicenseFile { get; set; }
        public string TaxCertificateFile { get; set; }
        public string RepresentativeIdCardFile { get; set; }
        public string OtherSupportFile { get; set; }
        
        // Legal verification status
        public string LegalVerificationStatus { get; set; }
        public long? LegalReviewedBy { get; set; }
        public DateTime? LegalReviewedAt { get; set; }
        public DateTime CreationTime { get; set; }
        public DateTime? LastModificationTime { get; set; }
    }
}
