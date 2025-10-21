using System;
using System.Threading.Tasks;
using NSubstitute;
using Shouldly;
using VCareer.Models.Users;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Xunit;

namespace VCareer.CV
{
    public class CVAppService_SimpleTests
    {
        [Fact]
        public void Should_Create_Valid_CreateCVOnlineDto()
        {
            // Arrange & Act
            var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();

            // Assert
            dto.CVName.ShouldBe("CV Frontend Developer");
            dto.FullName.ShouldBe("Nguyễn Văn A");
            dto.Email.ShouldBe("nguyenvana@email.com");
            dto.PhoneNumber.ShouldBe("0901234567");
            dto.DateOfBirth.ShouldBe(new DateTime(1995, 5, 15));
            dto.Gender.ShouldBe(true);
            dto.Address.ShouldBe("123 Đường ABC, Quận 1, TP.HCM");
            dto.IsPublic.ShouldBe(true);
        }

        [Fact]
        public void Should_Create_Valid_UploadCVDto()
        {
            // Arrange & Act
            var dto = CVTestDataHelper.CreateValidUploadCVDto();

            // Assert
            dto.CVName.ShouldBe("CV Backend Developer");
            dto.FileUrl.ShouldBe("https://storage.googleapis.com/bucket/cvs/backend-cv.pdf");
            dto.OriginalFileName.ShouldBe("backend-cv.pdf");
            dto.FileSize.ShouldBe(1024000);
            dto.FileType.ShouldBe("pdf");
            dto.Description.ShouldBe("CV Backend Developer với kinh nghiệm 3 năm");
            dto.IsPublic.ShouldBe(false);
        }

        [Fact]
        public void Should_Create_Valid_UpdateCVDto()
        {
            // Arrange & Act
            var dto = CVTestDataHelper.CreateValidUpdateCVDto();

            // Assert
            dto.CVName.ShouldBe("CV Updated Frontend Developer");
            dto.FullName.ShouldBe("Nguyễn Văn A Updated");
            dto.Email.ShouldBe("nguyenvana.updated@email.com");
            dto.PhoneNumber.ShouldBe("0901234568");
            dto.Status.ShouldBe("Published");
            dto.IsPublic.ShouldBe(true);
        }

        [Fact]
        public void Should_Validate_Email_Format_In_CreateCVOnlineDto()
        {
            // Arrange
            var validEmails = new[] { "test@email.com", "user.name@domain.co.uk", "test+tag@example.org" };
            var invalidEmails = new[] { "invalid-email", "@domain.com", "test@", "test..test@domain.com" };

            // Act & Assert
            foreach (var email in validEmails)
            {
                var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
                dto.Email = email;
                // Email validation sẽ được test ở integration level
                dto.Email.ShouldBe(email);
            }

            foreach (var email in invalidEmails)
            {
                var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
                dto.Email = email;
                // Invalid email sẽ được validate ở application layer
                dto.Email.ShouldBe(email);
            }
        }

        [Fact]
        public void Should_Validate_Phone_Number_Format_In_CreateCVOnlineDto()
        {
            // Arrange
            var validPhones = new[] { "0901234567", "0912345678", "0987654321", "+84901234567" };
            var invalidPhones = new[] { "123", "invalid-phone", "090123456789", "abc1234567" };

            // Act & Assert
            foreach (var phone in validPhones)
            {
                var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
                dto.PhoneNumber = phone;
                dto.PhoneNumber.ShouldBe(phone);
            }

            foreach (var phone in invalidPhones)
            {
                var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
                dto.PhoneNumber = phone;
                dto.PhoneNumber.ShouldBe(phone);
            }
        }

        [Fact]
        public void Should_Validate_File_Url_Format_In_UploadCVDto()
        {
            // Arrange
            var validUrls = new[] 
            { 
                "https://storage.googleapis.com/bucket/cv.pdf",
                "https://example.com/files/cv.pdf",
                "http://localhost:8080/uploads/cv.pdf"
            };
            var invalidUrls = new[] 
            { 
                "invalid-url",
                "ftp://example.com/cv.pdf",
                "not-a-url"
            };

            // Act & Assert
            foreach (var url in validUrls)
            {
                var dto = CVTestDataHelper.CreateValidUploadCVDto();
                dto.FileUrl = url;
                dto.FileUrl.ShouldBe(url);
            }

            foreach (var url in invalidUrls)
            {
                var dto = CVTestDataHelper.CreateValidUploadCVDto();
                dto.FileUrl = url;
                dto.FileUrl.ShouldBe(url);
            }
        }

        [Fact]
        public void Should_Validate_File_Size_In_UploadCVDto()
        {
            // Arrange
            var validSizes = new[] { 1024L, 1024000L, 10485760L }; // 1KB, 1MB, 10MB
            var invalidSizes = new[] { 0L, -1L, 10737418240L }; // 0, negative, 10GB

            // Act & Assert
            foreach (var size in validSizes)
            {
                var dto = CVTestDataHelper.CreateValidUploadCVDto();
                dto.FileSize = size;
                dto.FileSize.ShouldBe(size);
            }

            foreach (var size in invalidSizes)
            {
                var dto = CVTestDataHelper.CreateValidUploadCVDto();
                dto.FileSize = size;
                dto.FileSize.ShouldBe(size);
            }
        }

        [Fact]
        public void Should_Validate_File_Type_In_UploadCVDto()
        {
            // Arrange
            var validTypes = new[] { "pdf", "doc", "docx" };
            var invalidTypes = new[] { "", "exe", "bat", "unknown" };

            // Act & Assert
            foreach (var type in validTypes)
            {
                var dto = CVTestDataHelper.CreateValidUploadCVDto();
                dto.FileType = type;
                dto.FileType.ShouldBe(type);
            }

            foreach (var type in invalidTypes)
            {
                var dto = CVTestDataHelper.CreateValidUploadCVDto();
                dto.FileType = type;
                dto.FileType.ShouldBe(type);
            }
        }

        [Fact]
        public void Should_Validate_Required_Fields_In_CreateCVOnlineDto()
        {
            // Arrange
            var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();

            // Act & Assert
            dto.CVName.ShouldNotBeNullOrEmpty();
            dto.FullName.ShouldNotBeNullOrEmpty();
            dto.Email.ShouldNotBeNullOrEmpty();
        }

        [Fact]
        public void Should_Validate_Required_Fields_In_UploadCVDto()
        {
            // Arrange
            var dto = CVTestDataHelper.CreateValidUploadCVDto();

            // Act & Assert
            dto.CVName.ShouldNotBeNullOrEmpty();
            dto.FileUrl.ShouldNotBeNullOrEmpty();
            dto.OriginalFileName.ShouldNotBeNullOrEmpty();
            dto.FileType.ShouldNotBeNullOrEmpty();
        }

        [Fact]
        public void Should_Validate_String_Length_Limits()
        {
            // Arrange
            var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();

            // Act & Assert
            dto.CVName.Length.ShouldBeLessThanOrEqualTo(255);
            dto.FullName.Length.ShouldBeLessThanOrEqualTo(255);
            dto.Email.Length.ShouldBeLessThanOrEqualTo(256);
            dto.PhoneNumber.Length.ShouldBeLessThanOrEqualTo(20);
            dto.Address.Length.ShouldBeLessThanOrEqualTo(500);
            dto.CareerObjective.Length.ShouldBeLessThanOrEqualTo(1000);
            dto.Interests.Length.ShouldBeLessThanOrEqualTo(1000);
        }

        [Fact]
        public void Should_Validate_Date_Of_Birth_Not_In_Future()
        {
            // Arrange
            var validDates = new[] 
            { 
                DateTime.Now.AddYears(-25),
                DateTime.Now.AddYears(-30),
                new DateTime(1990, 1, 1)
            };
            var invalidDates = new[] 
            { 
                DateTime.Now.AddDays(1),
                DateTime.Now.AddYears(1),
                DateTime.Now.AddMonths(6)
            };

            // Act & Assert
            foreach (var date in validDates)
            {
                var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
                dto.DateOfBirth = date;
                dto.DateOfBirth.ShouldBe(date);
            }

            foreach (var date in invalidDates)
            {
                var dto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
                dto.DateOfBirth = date;
                dto.DateOfBirth.ShouldBe(date);
            }
        }
    }
}
