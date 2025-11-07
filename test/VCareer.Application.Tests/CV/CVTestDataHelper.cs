using System;
using VCareer.Dto.CVDto;
using VCareer.Models.Users;

namespace VCareer.CV
{
    public static class CVTestDataHelper
    {
        /// <summary>
        /// Tạo CreateCVOnlineDto hợp lệ
        /// </summary>
        public static CreateCVOnlineDto CreateValidCreateCVOnlineDto()
        {
            return new CreateCVOnlineDto
            {
                CVName = "CV Frontend Developer",
                CareerObjective = "Tìm kiếm vị trí Frontend Developer tại công ty công nghệ",
                FullName = "Nguyễn Văn A",
                Email = "nguyenvana@email.com",
                PhoneNumber = "0901234567",
                DateOfBirth = new DateTime(1995, 5, 15),
                
                Address = "123 Đường ABC, Quận 1, TP.HCM",
                WorkExperience = @"[
                    {
                        ""company"": ""Công ty ABC"",
                        ""position"": ""Frontend Developer"",
                        ""startDate"": ""2020-01-01"",
                        ""endDate"": ""2023-12-31"",
                        ""description"": ""Phát triển ứng dụng web sử dụng React, Vue.js""
                    }
                ]",
                Education = @"[
                    {
                        ""school"": ""Đại học Bách Khoa TP.HCM"",
                        ""degree"": ""Cử nhân Công nghệ Thông tin"",
                        ""startDate"": ""2013-09-01"",
                        ""endDate"": ""2017-06-30"",
                        ""gpa"": ""3.5""
                    }
                ]",
                Skills = @"[
                    ""JavaScript"",
                    ""React"",
                    ""Vue.js"",
                    ""HTML/CSS"",
                    ""TypeScript""
                ]",
                Projects = @"[
                    {
                        ""name"": ""E-commerce Website"",
                        ""description"": ""Website bán hàng trực tuyến"",
                        ""technologies"": ""React, Node.js, MongoDB"",
                        ""url"": ""https://github.com/user/ecommerce""
                    }
                ]",
                Certificates = @"[
                    {
                        ""name"": ""AWS Certified Developer"",
                        ""issuer"": ""Amazon Web Services"",
                        ""date"": ""2023-03-15""
                    }
                ]",
                Languages = @"[
                    {
                        ""language"": ""Tiếng Anh"",
                        ""level"": ""Trung cấp""
                    }
                ]",
                Interests = "Đọc sách, chơi game, du lịch",
                IsPublic = true
            };
        }

        /// <summary>
        /// Tạo CreateCVOnlineDto không hợp lệ
        /// </summary>
        public static CreateCVOnlineDto CreateInvalidCreateCVOnlineDto()
        {
            return new CreateCVOnlineDto
            {
                CVName = "", // Invalid: empty name
                CareerObjective = "Tìm kiếm vị trí Frontend Developer",
                FullName = "", // Invalid: empty name
                Email = "invalid-email-format", // Invalid: wrong email format
                PhoneNumber = "invalid-phone", // Invalid: wrong phone format
                DateOfBirth = DateTime.Now.AddDays(1), // Invalid: future date
                
                Address = "123 Đường ABC",
                WorkExperience = "Invalid JSON", // Invalid: not valid JSON
                Education = "Invalid JSON", // Invalid: not valid JSON
                Skills = "Invalid JSON", // Invalid: not valid JSON
                Projects = "Invalid JSON", // Invalid: not valid JSON
                Certificates = "Invalid JSON", // Invalid: not valid JSON
                Languages = "Invalid JSON", // Invalid: not valid JSON
                Interests = "Đọc sách",
                IsPublic = false
            };
        }

        /// <summary>
        /// Tạo UploadCVDto hợp lệ
        /// </summary>
        public static UploadCVDto CreateValidUploadCVDto()
        {
            return new UploadCVDto
            {
                CVName = "CV Backend Developer",
                FileUrl = "https://storage.googleapis.com/bucket/cvs/backend-cv.pdf",
                OriginalFileName = "backend-cv.pdf",
                FileSize = 1024000, // 1MB
                FileType = "pdf",
                Description = "CV Backend Developer với kinh nghiệm 3 năm",
                IsPublic = false
            };
        }

        /// <summary>
        /// Tạo UploadCVDto không hợp lệ
        /// </summary>
        public static UploadCVDto CreateInvalidUploadCVDto()
        {
            return new UploadCVDto
            {
                CVName = "", // Invalid: empty name
                FileUrl = "invalid-url", // Invalid: not a valid URL
                OriginalFileName = "", // Invalid: empty filename
                FileSize = 0, // Invalid: zero size
                FileType = "", // Invalid: empty file type
                Description = "CV Backend Developer",
                IsPublic = false
            };
        }

        /// <summary>
        /// Tạo UpdateCVDto hợp lệ
        /// </summary>
        public static UpdateCVDto CreateValidUpdateCVDto()
        {
            return new UpdateCVDto
            {
                CVName = "CV Updated Frontend Developer",
                CareerObjective = "Tìm kiếm vị trí Senior Frontend Developer",
                FullName = "Nguyễn Văn A Updated",
                Email = "nguyenvana.updated@email.com",
                PhoneNumber = "0901234568",
                DateOfBirth = new DateTime(1995, 5, 15),
                
                Address = "456 Đường XYZ, Quận 2, TP.HCM",
                WorkExperience = @"[
                    {
                        ""company"": ""Công ty XYZ"",
                        ""position"": ""Senior Frontend Developer"",
                        ""startDate"": ""2024-01-01"",
                        ""endDate"": null,
                        ""description"": ""Lead team phát triển ứng dụng web""
                    }
                ]",
                Education = @"[
                    {
                        ""school"": ""Đại học Bách Khoa TP.HCM"",
                        ""degree"": ""Thạc sĩ Công nghệ Thông tin"",
                        ""startDate"": ""2017-09-01"",
                        ""endDate"": ""2019-06-30"",
                        ""gpa"": ""3.8""
                    }
                ]",
                Skills = @"[
                    ""JavaScript"",
                    ""React"",
                    ""Vue.js"",
                    ""Angular"",
                    ""TypeScript"",
                    ""Node.js""
                ]",
                Projects = @"[
                    {
                        ""name"": ""Enterprise Application"",
                        ""description"": ""Ứng dụng quản lý doanh nghiệp"",
                        ""technologies"": ""Angular, .NET Core, SQL Server"",
                        ""url"": ""https://github.com/user/enterprise-app""
                    }
                ]",
                Certificates = @"[
                    {
                        ""name"": ""Microsoft Certified: Azure Developer"",
                        ""issuer"": ""Microsoft"",
                        ""date"": ""2023-06-20""
                    }
                ]",
                Languages = @"[
                    {
                        ""language"": ""Tiếng Anh"",
                        ""level"": ""Cao cấp""
                    }
                ]",
                Interests = "Đọc sách, chơi game, du lịch, học công nghệ mới",
                IsPublic = true,
                Status = "Published"
            };
        }

        /// <summary>
        /// Tạo UpdateCVDto không hợp lệ
        /// </summary>
        public static UpdateCVDto CreateInvalidUpdateCVDto()
        {
            return new UpdateCVDto
            {
                CVName = "", // Invalid: empty name
                CareerObjective = "Tìm kiếm vị trí Senior Frontend Developer",
                FullName = "", // Invalid: empty name
                Email = "invalid-email", // Invalid: wrong email format
                PhoneNumber = "invalid-phone", // Invalid: wrong phone format
                DateOfBirth = DateTime.Now.AddDays(1), // Invalid: future date
                
                Address = "456 Đường XYZ",
                WorkExperience = "Invalid JSON", // Invalid: not valid JSON
                Education = "Invalid JSON", // Invalid: not valid JSON
                Skills = "Invalid JSON", // Invalid: not valid JSON
                Projects = "Invalid JSON", // Invalid: not valid JSON
                Certificates = "Invalid JSON", // Invalid: not valid JSON
                Languages = "Invalid JSON", // Invalid: not valid JSON
                Interests = "Đọc sách",
                IsPublic = false,
                Status = "InvalidStatus" // Invalid: wrong status
            };
        }

        /// <summary>
        /// Tạo CandidateProfile test
        /// </summary>
        public static CandidateProfile CreateTestCandidateProfile(Guid? userId = null)
        {
            var id = userId ?? Guid.NewGuid();
            return new CandidateProfile
            {
                UserId = id,
                DateOfbirth = new DateTime(1995, 5, 15),
                Gender = true,
                Location = "TP.HCM",
                ProfileVisibility = true,
                Status = true
            };
        }

        /// <summary>
        /// Tạo CurriculumVitae test
        /// </summary>
        public static CurriculumVitae CreateTestCurriculumVitae(Guid? candidateId = null, string cvType = "Online")
        {
            var id = candidateId ?? Guid.NewGuid();
            return new CurriculumVitae
            {
                CandidateId = id,
                CVName = "Test CV",
                /*CVType = cvType,*/
                Status = "Draft",
                IsDefault = false,
                IsPublic = false,
                FullName = "Test User",
                Email = "test@email.com",
                PhoneNumber = "0901234567",
                DateOfBirth = new DateTime(1995, 5, 15),
                
                Address = "Test Address",
                CareerObjective = "Test Career Objective",
                WorkExperience = @"[{""company"":""Test Company"",""position"":""Test Position""}]",
                Education = @"[{""school"":""Test School"",""degree"":""Test Degree""}]",
                Skills = @"[""Test Skill""]",
                Projects = @"[{""name"":""Test Project""}]",
                Certificates = @"[{""name"":""Test Certificate""}]",
                Languages = @"[{""language"":""Test Language""}]",
                Interests = "Test Interests"
            };
        }

        /// <summary>
        /// Tạo CurriculumVitae upload test
        /// </summary>
        public static CurriculumVitae CreateTestUploadCurriculumVitae(Guid? candidateId = null)
        {
            var id = candidateId ?? Guid.NewGuid();
            return new CurriculumVitae
            {
                CandidateId = id,
                CVName = "Test Upload CV",
                /*CVType = "Upload",*/
                Status = "Published",
                IsDefault = false,
                IsPublic = false,
                OriginalFileName = "test-cv.pdf",
                FileUrl = "https://storage.googleapis.com/bucket/cvs/test-cv.pdf",
                FileSize = 1024000,
                FileType = "pdf",
                Description = "Test Upload CV Description"
            };
        }
    }
}
