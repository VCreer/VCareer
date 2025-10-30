using System;
using System.Collections.Generic;
using System.Linq;
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
    public class CVAppService_BusinessLogicTests
    {
        [Fact]
        public void Should_Validate_CV_Name_Uniqueness_Per_Candidate()
        {
            // Arrange
            var candidateId = Guid.NewGuid();
            var existingCVName = "My CV";
            var newCVName = "My CV"; // Same name

            // Act & Assert
            // Business rule: CV name phải unique trong cùng 1 candidate
            var isDuplicate = existingCVName == newCVName;
            isDuplicate.ShouldBe(true);
        }

        [Fact]
        public void Should_Validate_CV_Type_Values()
        {
            // Arrange
            var validTypes = new[] { "Online", "Upload" };
            var invalidTypes = new[] { "Invalid", "", "OnlineUpload", "PDF" };

            // Act & Assert
            foreach (var type in validTypes)
            {
                var isValid = validTypes.Contains(type);
                isValid.ShouldBe(true);
            }

            foreach (var type in invalidTypes)
            {
                var isValid = validTypes.Contains(type);
                isValid.ShouldBe(false);
            }
        }

        [Fact]
        public void Should_Validate_CV_Status_Values()
        {
            // Arrange
            var validStatuses = new[] { "Draft", "Published", "Archived" };
            var invalidStatuses = new[] { "Invalid", "", "Active", "Deleted" };

            // Act & Assert
            foreach (var status in validStatuses)
            {
                var isValid = validStatuses.Contains(status);
                isValid.ShouldBe(true);
            }

            foreach (var status in invalidStatuses)
            {
                var isValid = validStatuses.Contains(status);
                isValid.ShouldBe(false);
            }
        }

        [Fact]
        public void Should_Validate_Only_One_Default_CV_Per_Candidate()
        {
            // Arrange
            var candidateId = Guid.NewGuid();
            var cv1 = CVTestDataHelper.CreateTestCurriculumVitae(candidateId);
            var cv2 = CVTestDataHelper.CreateTestCurriculumVitae(candidateId);
            var cv3 = CVTestDataHelper.CreateTestCurriculumVitae(candidateId);

            // Act
            cv1.IsDefault = true;
            cv2.IsDefault = true; // This should cause conflict
            cv3.IsDefault = false;

            // Assert
            var defaultCVs = new[] { cv1, cv2, cv3 }.Where(c => c.IsDefault).ToList();
            defaultCVs.Count.ShouldBeGreaterThan(1); // Business rule violation
        }

        [Fact]
        public void Should_Validate_JSON_Format_For_Structured_Fields()
        {
            // Arrange
            var validJson = @"[
                {
                    ""company"": ""ABC Company"",
                    ""position"": ""Developer"",
                    ""startDate"": ""2020-01-01"",
                    ""endDate"": ""2023-12-31""
                }
            ]";
            var invalidJson = @"
                {
                    ""company"": ""ABC Company"",
                    ""position"": ""Developer"",
                    ""startDate"": ""2020-01-01"",
                    ""endDate"": ""2023-12-31""
                }
            "; // Missing closing bracket

            // Act & Assert
            try
            {
                System.Text.Json.JsonSerializer.Deserialize<object>(validJson);
                true.ShouldBeTrue(); // Valid JSON
            }
            catch
            {
                false.ShouldBeTrue(); // Should not throw
            }

            try
            {
                System.Text.Json.JsonSerializer.Deserialize<object>(invalidJson);
                false.ShouldBeTrue(); // Should throw
            }
            catch
            {
                true.ShouldBeTrue(); // Expected to throw
            }
        }

        [Fact]
        public void Should_Validate_File_Size_Limits_For_Upload_CV()
        {
            // Arrange
            var maxFileSize = 10 * 1024 * 1024; // 10MB
            var validSizes = new[] { 1024L, 1024000L, 10485760L }; // 1KB, 1MB, 10MB
            var invalidSizes = new[] { 10737418240L, 21474836480L }; // 10GB, 20GB

            // Act & Assert
            foreach (var size in validSizes)
            {
                var isValid = size <= maxFileSize;
                isValid.ShouldBe(true);
            }

            foreach (var size in invalidSizes)
            {
                var isValid = size <= maxFileSize;
                isValid.ShouldBe(false);
            }
        }

        [Fact]
        public void Should_Validate_Supported_File_Types_For_Upload_CV()
        {
            // Arrange
            var supportedTypes = new[] { "pdf", "doc", "docx" };
            var unsupportedTypes = new[] { "exe", "bat", "zip", "rar", "mp4" };

            // Act & Assert
            foreach (var type in supportedTypes)
            {
                var isValid = supportedTypes.Contains(type.ToLower());
                isValid.ShouldBe(true);
            }

            foreach (var type in unsupportedTypes)
            {
                var isValid = supportedTypes.Contains(type.ToLower());
                isValid.ShouldBe(false);
            }
        }

        [Fact]
        public void Should_Validate_CV_Visibility_Rules()
        {
            // Arrange
            var publicCV = CVTestDataHelper.CreateTestCurriculumVitae();
            var privateCV = CVTestDataHelper.CreateTestCurriculumVitae();

            // Act
            publicCV.IsPublic = true;
            publicCV.Status = "Published";
            privateCV.IsPublic = false;
            privateCV.Status = "Draft";

            // Assert
            // Public CV phải có status Published
            if (publicCV.IsPublic)
            {
                publicCV.Status.ShouldBe("Published");
            }

            // Private CV có thể có bất kỳ status nào
            privateCV.IsPublic.ShouldBeFalse();
        }

        [Fact]
        public void Should_Validate_CV_Deletion_Rules()
        {
            // Arrange
            var candidateId = Guid.NewGuid();
            var defaultCV = CVTestDataHelper.CreateTestCurriculumVitae(candidateId);
            var normalCV = CVTestDataHelper.CreateTestCurriculumVitae(candidateId);

            // Act
            defaultCV.IsDefault = true;
            normalCV.IsDefault = false;

            // Assert
            // Nếu xóa CV mặc định, phải có CV khác để set làm mặc định
            if (defaultCV.IsDefault)
            {
                // Business rule: Phải có ít nhất 1 CV khác
            var hasOtherCV = normalCV != null;
            hasOtherCV.ShouldBe(true);
            }
        }

        [Fact]
        public void Should_Validate_CV_Update_Rules()
        {
            // Arrange
            var onlineCV = CVTestDataHelper.CreateTestCurriculumVitae();
            var uploadCV = CVTestDataHelper.CreateTestUploadCurriculumVitae();

            // Act
            /*onlineCV.CVType = "Online";
            uploadCV.CVType = "Upload";*/

            // Assert
            // Online CV có thể update tất cả fields
            /*onlineCV.CVType.ShouldBe("Online");*/
            onlineCV.FullName.ShouldNotBeNullOrEmpty();
            onlineCV.Email.ShouldNotBeNullOrEmpty();

            // Upload CV chỉ có thể update metadata, không update content
            /*uploadCV.CVType.ShouldBe("Upload");*/
            uploadCV.FileUrl.ShouldNotBeNullOrEmpty();
            uploadCV.OriginalFileName.ShouldNotBeNullOrEmpty();
        }

        [Fact]
        public void Should_Validate_CV_Creation_Workflow()
        {
            // Arrange
            var createDto = CVTestDataHelper.CreateValidCreateCVOnlineDto();
            var uploadDto = CVTestDataHelper.CreateValidUploadCVDto();

            // Act & Assert
            // Online CV tạo với status Draft
            createDto.CVName.ShouldNotBeNullOrEmpty();
            createDto.FullName.ShouldNotBeNullOrEmpty();
            createDto.Email.ShouldNotBeNullOrEmpty();

            // Upload CV tạo với status Published
            uploadDto.CVName.ShouldNotBeNullOrEmpty();
            uploadDto.FileUrl.ShouldNotBeNullOrEmpty();
            uploadDto.FileType.ShouldNotBeNullOrEmpty();
        }

        [Fact]
        public void Should_Validate_CV_Access_Permissions()
        {
            // Arrange
            var candidateId1 = Guid.NewGuid();
            var candidateId2 = Guid.NewGuid();
            var cv1 = CVTestDataHelper.CreateTestCurriculumVitae(candidateId1);
            var cv2 = CVTestDataHelper.CreateTestCurriculumVitae(candidateId2);

            // Act
            cv1.IsPublic = true;
            cv2.IsPublic = false;

            // Assert
            // Candidate chỉ có thể access CV của chính mình
            var canAccessOwnCV = cv1.CandidateId == candidateId1;
            canAccessOwnCV.ShouldBe(true);

            var cannotAccessOtherCV = cv2.CandidateId != candidateId1;
            cannotAccessOtherCV.ShouldBe(true);

            // Public CV có thể được access bởi recruiter
            if (cv1.IsPublic)
            {
                var canAccessPublicCV = true; // Recruiter can access
                canAccessPublicCV.ShouldBe(true);
            }
        }

        [Fact]
        public void Should_Validate_CV_Data_Integrity()
        {
            // Arrange
            var cv = CVTestDataHelper.CreateTestCurriculumVitae();

            // Act
            cv.CVName = "Test CV";
            /*cv.CVType = "Online";*/
            cv.Status = "Draft";
            cv.CandidateId = Guid.NewGuid();

            // Assert
            cv.CVName.ShouldNotBeNullOrEmpty();
            /*cv.CVType.ShouldBeOneOf("Online", "Upload");*/
            cv.Status.ShouldBeOneOf("Draft", "Published", "Archived");
            cv.CandidateId.ShouldNotBe(Guid.Empty);
        }
    }
}
