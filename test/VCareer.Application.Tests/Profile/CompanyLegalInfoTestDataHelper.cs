/*using System;
using VCareer.Models.Companies;

namespace VCareer.Profile;

public static class CompanyLegalInfoTestDataHelper
{
    public static SubmitCompanyLegalInfoDto CreateValidSubmitCompanyLegalInfoDto()
    {
        return new SubmitCompanyLegalInfoDto
        {
            CompanyName = "Công ty TNHH ABC",
            CompanyCode = "ABC123",
            Description = "Công ty công nghệ thông tin hàng đầu Việt Nam",
            HeadquartersAddress = "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
            ContactEmail = "contact@abc.com",
            ContactPhone = "0901234567",
            CompanySize = 50,
            IndustryId = 1,
            FoundedYear = 2020,
            TaxCode = "0123456789",
            BusinessLicenseNumber = "41A1234567",
            BusinessLicenseIssueDate = new DateTime(2020, 1, 1),
            BusinessLicenseIssuePlace = "Sở Kế hoạch và Đầu tư TP.HCM",
            LegalRepresentative = "Nguyễn Văn A",
            BusinessLicenseFile = "https://storage.googleapis.com/bucket/licenses/abc-license.pdf",
            TaxCertificateFile = "https://storage.googleapis.com/bucket/certificates/abc-tax.pdf",
            RepresentativeIdCardFile = "https://storage.googleapis.com/bucket/idcards/representative-cccd.pdf",
            OtherSupportFile = "https://storage.googleapis.com/bucket/others/authorization.pdf"
        };
    }

    public static SubmitCompanyLegalInfoDto CreateInvalidSubmitCompanyLegalInfoDto()
    {
        return new SubmitCompanyLegalInfoDto
        {
            CompanyName = "", // Invalid: empty name
            CompanyCode = "ABC123",
            Description = "Công ty công nghệ thông tin",
            HeadquartersAddress = "123 Đường ABC, Quận 1, TP.HCM",
            ContactEmail = "invalid-email-format", // Invalid: wrong email format
            ContactPhone = "invalid-phone", // Invalid: wrong phone format
            CompanySize = 0, // Invalid: zero size
            IndustryId = 1,
            FoundedYear = DateTime.Now.Year + 1, // Invalid: future year
            TaxCode = "123", // Invalid: too short
            BusinessLicenseNumber = "INVALID", // Invalid: wrong format
            BusinessLicenseIssueDate = DateTime.Now.AddDays(1), // Invalid: future date
            BusinessLicenseIssuePlace = "Test Place",
            LegalRepresentative = "Test Representative"
        };
    }

    public static UpdateCompanyLegalInfoDto CreateValidUpdateCompanyLegalInfoDto()
    {
        return new UpdateCompanyLegalInfoDto
        {
            CompanyName = "Công ty TNHH ABC (Updated)",
            CompanyCode = "ABC123UPD",
            Description = "Công ty công nghệ thông tin - Đã cập nhật",
            HeadquartersAddress = "456 Đường XYZ, Phường DEF, Quận 2, TP.HCM",
            ContactEmail = "newcontact@abc.com",
            ContactPhone = "0909876543",
            CompanySize = 100,
            IndustryId = 2,
            FoundedYear = 2019,
            TaxCode = "0123456789",
            BusinessLicenseNumber = "41A1234567",
            BusinessLicenseIssueDate = new DateTime(2019, 6, 15),
            BusinessLicenseIssuePlace = "Sở Kế hoạch và Đầu tư TP.HCM",
            LegalRepresentative = "Nguyễn Văn B",
            BusinessLicenseFile = "https://storage.googleapis.com/bucket/licenses/abc-license-updated.pdf",
            TaxCertificateFile = "https://storage.googleapis.com/bucket/certificates/abc-tax-updated.pdf",
            RepresentativeIdCardFile = "https://storage.googleapis.com/bucket/idcards/representative-cccd-updated.pdf",
            OtherSupportFile = "https://storage.googleapis.com/bucket/others/authorization-updated.pdf"
        };
    }

    public static CompanyLegalInfoDto CreateExpectedCompanyLegalInfoDto(int companyId)
    {
        return new CompanyLegalInfoDto
        {
            Id = companyId,
            CompanyName = "Công ty TNHH ABC",
            CompanyCode = "ABC123",
            VerificationStatus = false,
            Description = "Công ty công nghệ thông tin hàng đầu Việt Nam",
            HeadquartersAddress = "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
            ContactEmail = "contact@abc.com",
            ContactPhone = "0901234567",
            Status = true,
            CompanySize = 50,
            IndustryId = 1,
            FoundedYear = 2020,
            LogoUrl = null,
            LegalDocumentUrl = null,
            CoverImageUrl = null,
            WebsiteUrl = null,
            CultureVideoUrl = null,
            VerifyAt = default(DateTime),
            
            // Legal Information fields
            TaxCode = "0123456789",
            BusinessLicenseNumber = "41A1234567",
            BusinessLicenseIssueDate = new DateTime(2020, 1, 1),
            BusinessLicenseIssuePlace = "Sở Kế hoạch và Đầu tư TP.HCM",
            LegalRepresentative = "Nguyễn Văn A",
            BusinessLicenseFile = "https://storage.googleapis.com/bucket/licenses/abc-license.pdf",
            TaxCertificateFile = "https://storage.googleapis.com/bucket/certificates/abc-tax.pdf",
            RepresentativeIdCardFile = "https://storage.googleapis.com/bucket/idcards/representative-cccd.pdf",
            OtherSupportFile = "https://storage.googleapis.com/bucket/others/authorization.pdf",
            LegalVerificationStatus = "pending",
            LegalReviewedBy = null,
            LegalReviewedAt = null,
            CreationTime = DateTime.UtcNow,
            LastModificationTime = null
        };
    }

    public static Company CreateTestCompany(int? companyId = null)
    {
        return new Company
        {
            CompanyName = "Công ty TNHH ABC",
            CompanyCode = "ABC123",
            VerificationStatus = false,
            Description = "Công ty công nghệ thông tin",
            HeadquartersAddress = "123 Đường ABC, Quận 1, TP.HCM",
            ContactEmail = "contact@abc.com",
            ContactPhone = "0901234567",
            Status = true,
            CompanySize = 50,
            IndustryId = 1,
            FoundedYear = 2020,
            LogoUrl = null,
            LegalDocumentUrl = null,
            CoverImageUrl = null,
            WebsiteUrl = null,
            CultureVideoUrl = null,
            VerifyAt = default(DateTime),
            
            // Legal Information fields
            TaxCode = "0123456789",
            BusinessLicenseNumber = "41A1234567",
            BusinessLicenseIssueDate = new DateTime(2020, 1, 1),
            BusinessLicenseIssuePlace = "Sở Kế hoạch và Đầu tư TP.HCM",
            LegalRepresentative = "Nguyễn Văn A",
            BusinessLicenseFile = "https://storage.googleapis.com/bucket/licenses/abc-license.pdf",
            TaxCertificateFile = "https://storage.googleapis.com/bucket/certificates/abc-tax.pdf",
            RepresentativeIdCardFile = "https://storage.googleapis.com/bucket/idcards/representative-cccd.pdf",
            OtherSupportFile = "https://storage.googleapis.com/bucket/others/authorization.pdf",
            LegalVerificationStatus = "pending",
            LegalReviewedBy = null,
            LegalReviewedAt = null
        };
    }

    public static Company CreateApprovedTestCompany(int? companyId = null)
    {
        var company = CreateTestCompany(companyId);
        company.LegalVerificationStatus = "approved";
        company.LegalReviewedBy = 1; // Admin ID
        company.LegalReviewedAt = DateTime.UtcNow;
        return company;
    }

    public static Company CreateRejectedTestCompany(int? companyId = null)
    {
        var company = CreateTestCompany(companyId);
        company.LegalVerificationStatus = "rejected";
        company.LegalReviewedBy = 1; // Admin ID
        company.LegalReviewedAt = DateTime.UtcNow;
        return company;
    }
}
*/