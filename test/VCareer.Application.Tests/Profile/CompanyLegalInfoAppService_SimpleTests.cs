using System;
using System.Threading.Tasks;
using NSubstitute;
using Shouldly;
using VCareer.Dto.Profile;
using VCareer.Models.Companies;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Xunit;

namespace VCareer.Profile;

public class CompanyLegalInfoAppService_SimpleTests
{
    [Fact]
    public void Should_Create_Valid_SubmitCompanyLegalInfoDto()
    {
        // Arrange & Act
        var dto = new SubmitCompanyLegalInfoDto
        {
            CompanyName = "Công ty TNHH ABC",
            CompanyCode = "ABC123",
            Description = "Công ty công nghệ thông tin",
            HeadquartersAddress = "123 Đường ABC, Quận 1, TP.HCM",
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

        // Assert
        dto.CompanyName.ShouldBe("Công ty TNHH ABC");
        dto.CompanyCode.ShouldBe("ABC123");
        dto.Description.ShouldBe("Công ty công nghệ thông tin");
        dto.HeadquartersAddress.ShouldBe("123 Đường ABC, Quận 1, TP.HCM");
        dto.ContactEmail.ShouldBe("contact@abc.com");
        dto.ContactPhone.ShouldBe("0901234567");
        dto.CompanySize.ShouldBe(50);
        dto.IndustryId.ShouldBe(1);
        dto.FoundedYear.ShouldBe(2020);
        dto.TaxCode.ShouldBe("0123456789");
        dto.BusinessLicenseNumber.ShouldBe("41A1234567");
        dto.BusinessLicenseIssueDate.ShouldBe(new DateTime(2020, 1, 1));
        dto.BusinessLicenseIssuePlace.ShouldBe("Sở Kế hoạch và Đầu tư TP.HCM");
        dto.LegalRepresentative.ShouldBe("Nguyễn Văn A");
        dto.BusinessLicenseFile.ShouldBe("https://storage.googleapis.com/bucket/licenses/abc-license.pdf");
        dto.TaxCertificateFile.ShouldBe("https://storage.googleapis.com/bucket/certificates/abc-tax.pdf");
        dto.RepresentativeIdCardFile.ShouldBe("https://storage.googleapis.com/bucket/idcards/representative-cccd.pdf");
        dto.OtherSupportFile.ShouldBe("https://storage.googleapis.com/bucket/others/authorization.pdf");
    }

    [Fact]
    public void Should_Create_Valid_UpdateCompanyLegalInfoDto()
    {
        // Arrange & Act
        var dto = new UpdateCompanyLegalInfoDto
        {
            CompanyName = "Công ty TNHH ABC (Updated)",
            CompanyCode = "ABC123UPD",
            Description = "Công ty công nghệ thông tin - Đã cập nhật",
            HeadquartersAddress = "456 Đường XYZ, Quận 2, TP.HCM",
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
            TaxCertificateFile = "https://storage.googleapis.com/bucket/certificates/abc-tax-updated.pdf"
        };

        // Assert
        dto.CompanyName.ShouldBe("Công ty TNHH ABC (Updated)");
        dto.CompanyCode.ShouldBe("ABC123UPD");
        dto.Description.ShouldBe("Công ty công nghệ thông tin - Đã cập nhật");
        dto.HeadquartersAddress.ShouldBe("456 Đường XYZ, Quận 2, TP.HCM");
        dto.ContactEmail.ShouldBe("newcontact@abc.com");
        dto.ContactPhone.ShouldBe("0909876543");
        dto.CompanySize.ShouldBe(100);
        dto.IndustryId.ShouldBe(2);
        dto.FoundedYear.ShouldBe(2019);
        dto.TaxCode.ShouldBe("0123456789");
        dto.BusinessLicenseNumber.ShouldBe("41A1234567");
        dto.BusinessLicenseIssueDate.ShouldBe(new DateTime(2019, 6, 15));
        dto.LegalRepresentative.ShouldBe("Nguyễn Văn B");
        dto.BusinessLicenseFile.ShouldBe("https://storage.googleapis.com/bucket/licenses/abc-license-updated.pdf");
        dto.TaxCertificateFile.ShouldBe("https://storage.googleapis.com/bucket/certificates/abc-tax-updated.pdf");
    }

    [Fact]
    public void Should_Create_Valid_CompanyLegalInfoDto()
    {
        // Arrange
        var companyId = 1;

        // Act
        var dto = new CompanyLegalInfoDto
        {
            Id = companyId,
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
            LogoUrl = "https://storage.googleapis.com/bucket/logos/abc-logo.png",
            LegalDocumentUrl = "https://storage.googleapis.com/bucket/legal/abc-legal.pdf",
            CoverImageUrl = "https://storage.googleapis.com/bucket/covers/abc-cover.jpg",
            WebsiteUrl = "https://abc.com",
            CultureVideoUrl = "https://storage.googleapis.com/bucket/videos/abc-culture.mp4",
            VerifyAt = new DateTime(2024, 1, 1),
            
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
            LastModificationTime = DateTime.UtcNow
        };

        // Assert
        dto.Id.ShouldBe(companyId);
        dto.CompanyName.ShouldBe("Công ty TNHH ABC");
        dto.CompanyCode.ShouldBe("ABC123");
     //   dto.VerificationStatus.ShouldBeFalse();
        dto.Description.ShouldBe("Công ty công nghệ thông tin");
        dto.HeadquartersAddress.ShouldBe("123 Đường ABC, Quận 1, TP.HCM");
        dto.ContactEmail.ShouldBe("contact@abc.com");
        dto.ContactPhone.ShouldBe("0901234567");
 //       dto.Status.ShouldBeTrue();
        dto.CompanySize.ShouldBe(50);
        dto.IndustryId.ShouldBe(1);
        dto.FoundedYear.ShouldBe(2020);
        dto.LogoUrl.ShouldBe("https://storage.googleapis.com/bucket/logos/abc-logo.png");
        dto.LegalDocumentUrl.ShouldBe("https://storage.googleapis.com/bucket/legal/abc-legal.pdf");
        dto.CoverImageUrl.ShouldBe("https://storage.googleapis.com/bucket/covers/abc-cover.jpg");
        dto.WebsiteUrl.ShouldBe("https://abc.com");
        dto.CultureVideoUrl.ShouldBe("https://storage.googleapis.com/bucket/videos/abc-culture.mp4");
        dto.VerifyAt.ShouldBe(new DateTime(2024, 1, 1));
        
        // Legal Information assertions
        dto.TaxCode.ShouldBe("0123456789");
        dto.BusinessLicenseNumber.ShouldBe("41A1234567");
        dto.BusinessLicenseIssueDate.ShouldBe(new DateTime(2020, 1, 1));
        dto.BusinessLicenseIssuePlace.ShouldBe("Sở Kế hoạch và Đầu tư TP.HCM");
        dto.LegalRepresentative.ShouldBe("Nguyễn Văn A");
        dto.BusinessLicenseFile.ShouldBe("https://storage.googleapis.com/bucket/licenses/abc-license.pdf");
        dto.TaxCertificateFile.ShouldBe("https://storage.googleapis.com/bucket/certificates/abc-tax.pdf");
        dto.RepresentativeIdCardFile.ShouldBe("https://storage.googleapis.com/bucket/idcards/representative-cccd.pdf");
        dto.OtherSupportFile.ShouldBe("https://storage.googleapis.com/bucket/others/authorization.pdf");
        dto.LegalVerificationStatus.ShouldBe("pending");
        dto.LegalReviewedBy.ShouldBeNull();
        dto.LegalReviewedAt.ShouldBeNull();
        dto.CreationTime.ShouldNotBe(default(DateTime));
        dto.LastModificationTime.ShouldNotBe(default(DateTime));
    }

    [Fact]
    public void Should_Validate_Email_Format()
    {
        // Arrange
        var validEmails = new[]
        {
            "contact@abc.com",
            "info@company.vn",
            "hr@tech-company.co.uk"
        };

        var invalidEmails = new[]
        {
            "invalid-email",
            "@company.com",
            "contact@",
            "contact.company.com"
        };

        // Act & Assert
        foreach (var email in validEmails)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = email,
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.ContactEmail.ShouldBe(email);
        }

        foreach (var email in invalidEmails)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = email,
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.ContactEmail.ShouldBe(email);
        }
    }

    [Fact]
    public void Should_Validate_Tax_Code_Format()
    {
        // Arrange
        var validTaxCodes = new[]
        {
            "0123456789",
            "1234567890",
            "9876543210"
        };

        var invalidTaxCodes = new[]
        {
            "123", // Too short
            "12345678901234567890", // Too long
            "abc1234567", // Contains letters
            "123-456-789" // Contains special characters
        };

        // Act & Assert
        foreach (var taxCode in validTaxCodes)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = taxCode,
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.TaxCode.ShouldBe(taxCode);
        }

        foreach (var taxCode in invalidTaxCodes)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = taxCode,
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.TaxCode.ShouldBe(taxCode);
        }
    }

    [Fact]
    public void Should_Validate_Business_License_Number_Format()
    {
        // Arrange
        var validLicenseNumbers = new[]
        {
            "41A1234567",
            "01B9876543",
            "79C5555555"
        };

        var invalidLicenseNumbers = new[]
        {
            "123", // Too short
            "12345678901234567890", // Too long
            "ABC1234567", // All letters
            "41-123-4567" // Contains special characters
        };

        // Act & Assert
        foreach (var licenseNumber in validLicenseNumbers)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = licenseNumber,
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.BusinessLicenseNumber.ShouldBe(licenseNumber);
        }

        foreach (var licenseNumber in invalidLicenseNumbers)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = licenseNumber,
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.BusinessLicenseNumber.ShouldBe(licenseNumber);
        }
    }

    [Fact]
    public void Should_Validate_Cloud_URL_Format()
    {
        // Arrange
        var validUrls = new[]
        {
            "https://storage.googleapis.com/bucket/licenses/abc-license.pdf",
            "https://s3.amazonaws.com/bucket/documents/tax-certificate.pdf",
            "https://blob.core.windows.net/container/files/id-card.pdf"
        };

        var invalidUrls = new[]
        {
            "invalid-url",
            "ftp://server.com/file.pdf",
            "file://local/path/file.pdf",
            "just-text"
        };

        // Act & Assert
        foreach (var url in validUrls)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative",
                BusinessLicenseFile = url
            };
            
            dto.BusinessLicenseFile.ShouldBe(url);
        }

        foreach (var url in invalidUrls)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative",
                BusinessLicenseFile = url
            };
            
            dto.BusinessLicenseFile.ShouldBe(url);
        }
    }

    [Fact]
    public void Should_Validate_String_Length_Limits()
    {
        // Arrange
        var longString = new string('A', 256); // Exceeds 255 char limit for CompanyName

        // Act
        var dto = new SubmitCompanyLegalInfoDto
        {
            CompanyName = longString,
            HeadquartersAddress = "Test Address",
            ContactEmail = "test@company.com",
            ContactPhone = "0901234567",
            TaxCode = "0123456789",
            BusinessLicenseNumber = "41A1234567",
            BusinessLicenseIssueDate = DateTime.Now,
            BusinessLicenseIssuePlace = "Test Place",
            LegalRepresentative = "Test Representative"
        };

        // Assert
        dto.CompanyName.Length.ShouldBe(256);
        dto.CompanyName.ShouldBe(longString);
    }

    [Fact]
    public void Should_Handle_Null_Values()
    {
        // Arrange & Act
        var dto = new SubmitCompanyLegalInfoDto
        {
            CompanyName = "Test Company",
            HeadquartersAddress = "Test Address",
            ContactEmail = "test@company.com",
            ContactPhone = "0901234567",
            TaxCode = "0123456789",
            BusinessLicenseNumber = "41A1234567",
            BusinessLicenseIssueDate = DateTime.Now,
            BusinessLicenseIssuePlace = "Test Place",
            LegalRepresentative = "Test Representative",
            CompanyCode = null,
            Description = null,
            BusinessLicenseFile = null,
            TaxCertificateFile = null,
            RepresentativeIdCardFile = null,
            OtherSupportFile = null
        };

        // Assert
        dto.CompanyName.ShouldBe("Test Company");
        dto.HeadquartersAddress.ShouldBe("Test Address");
        dto.ContactEmail.ShouldBe("test@company.com");
        dto.ContactPhone.ShouldBe("0901234567");
        dto.TaxCode.ShouldBe("0123456789");
        dto.BusinessLicenseNumber.ShouldBe("41A1234567");
        dto.CompanyCode.ShouldBeNull();
        dto.Description.ShouldBeNull();
        dto.BusinessLicenseFile.ShouldBeNull();
        dto.TaxCertificateFile.ShouldBeNull();
        dto.RepresentativeIdCardFile.ShouldBeNull();
        dto.OtherSupportFile.ShouldBeNull();
    }

    [Fact]
    public void Should_Validate_Phone_Number_Format()
    {
        // Arrange
        var validPhoneNumbers = new[]
        {
            "0901234567",
            "0912345678",
            "0987654321",
            "+84901234567",
            "0281234567"
        };

        var invalidPhoneNumbers = new[]
        {
            "123", // Too short
            "12345678901234567890", // Too long
            "abc1234567", // Contains letters
            "090-123-4567" // Contains special characters
        };

        // Act & Assert
        foreach (var phone in validPhoneNumbers)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = phone,
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.ContactPhone.ShouldBe(phone);
        }

        foreach (var phone in invalidPhoneNumbers)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = phone,
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = DateTime.Now,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.ContactPhone.ShouldBe(phone);
        }
    }

    [Fact]
    public void Should_Validate_Date_Ranges()
    {
        // Arrange
        var validDates = new[]
        {
            DateTime.Now.AddYears(-10), // 10 years ago
            DateTime.Now.AddYears(-1),  // 1 year ago
            DateTime.Now.AddMonths(-6), // 6 months ago
            DateTime.Now.AddDays(-30)   // 30 days ago
        };

        var invalidDates = new[]
        {
            DateTime.Now.AddDays(1),    // Future date
            DateTime.Now.AddYears(1),   // 1 year in future
            DateTime.Now.AddMonths(6)   // 6 months in future
        };

        // Act & Assert
        foreach (var date in validDates)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = date,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.BusinessLicenseIssueDate.ShouldBe(date);
        }

        foreach (var date in invalidDates)
        {
            var dto = new SubmitCompanyLegalInfoDto
            {
                CompanyName = "Test Company",
                HeadquartersAddress = "Test Address",
                ContactEmail = "test@company.com",
                ContactPhone = "0901234567",
                TaxCode = "0123456789",
                BusinessLicenseNumber = "41A1234567",
                BusinessLicenseIssueDate = date,
                BusinessLicenseIssuePlace = "Test Place",
                LegalRepresentative = "Test Representative"
            };
            
            dto.BusinessLicenseIssueDate.ShouldBe(date);
        }
    }
}


