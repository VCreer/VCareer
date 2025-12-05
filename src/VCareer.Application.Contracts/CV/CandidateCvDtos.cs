using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.CV
{
    /// <summary>
    /// DTO cho việc tạo mới Candidate CV
    /// </summary>
    public class CreateCandidateCvDto
    {
        [Required]
        public Guid TemplateId { get; set; }

        [Required]
        [StringLength(200)]
        public string CvName { get; set; }

        [Required]
        public string DataJson { get; set; }

        /// <summary>
        /// Blocks structure JSON (optional, cho block-based editor)
        /// </summary>
        public string? BlocksJson { get; set; }

        public bool IsPublished { get; set; }

        public bool IsDefault { get; set; }

        public bool IsPublic { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO cho việc cập nhật Candidate CV
    /// </summary>
    public class UpdateCandidateCvDto
    {
        public Guid? TemplateId { get; set; }

        [StringLength(200)]
        public string? CvName { get; set; }

        public string? DataJson { get; set; }

        /// <summary>
        /// Blocks structure JSON (optional, cho block-based editor)
        /// </summary>
        public string? BlocksJson { get; set; }

        public bool? IsPublished { get; set; }

        public bool? IsDefault { get; set; }

        public bool? IsPublic { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO để trả về Candidate CV
    /// </summary>
    public class CandidateCvDto : EntityDto<Guid>
    {
        public Guid CandidateId { get; set; }

        public Guid TemplateId { get; set; }

        public string CvName { get; set; }

        /// <summary>
        /// DataJson - chứa tất cả thông tin CV (nguồn dữ liệu chính theo schema)
        /// </summary>
        public string DataJson { get; set; }

        /// <summary>
        /// BlocksJson - cấu trúc blocks với thứ tự, title, meta (cho block-based editor)
        /// Nếu có, sẽ ưu tiên dùng để rebuild blocks khi load.
        /// </summary>
        public string? BlocksJson { get; set; }

        /// <summary>
        /// HtmlContent - snapshot HTML đã render của CV (phục vụ xem/gửi nhanh)
        /// </summary>
        public string? HtmlContent { get; set; }

        public bool IsPublished { get; set; }

        public bool IsDefault { get; set; }

        public bool IsPublic { get; set; }

        public DateTime? PublishedAt { get; set; }

        public int ViewCount { get; set; }

        public string? Notes { get; set; }

        /// <summary>
        /// Thông tin template (optional, chỉ load khi cần)
        /// </summary>
        public CvTemplateDto? Template { get; set; }
    }

    /// <summary>
    /// DTO để filter và search Candidate CVs
    /// </summary>
    public class GetCandidateCvListDto : PagedAndSortedResultRequestDto
    {
        public Guid? TemplateId { get; set; }

        public bool? IsPublished { get; set; }

        public bool? IsDefault { get; set; }

        public bool? IsPublic { get; set; }

        public string? SearchKeyword { get; set; }
    }

    /// <summary>
    /// DTO để render CV với template
    /// </summary>
    public class RenderCvDto
    {
        public Guid CvId { get; set; }

        /// <summary>
        /// Rendered HTML của CV
        /// </summary>
        public string HtmlContent { get; set; }
    }

    /// <summary>
    /// DTO cho CV data structure (định dạng JSON)
    /// </summary>
    public class CvDataDto
    {
        // Personal Information
        public PersonalInfoDto? PersonalInfo { get; set; }

        // Work Experience
        public List<WorkExperienceDto>? WorkExperiences { get; set; }

        // Education
        public List<EducationDto>? Educations { get; set; }

        // Skills
        public List<SkillDto>? Skills { get; set; }

        // Projects
        public List<ProjectDto>? Projects { get; set; }

        // Certificates
        public List<CertificateDto>? Certificates { get; set; }

        // Languages
        public List<LanguageDto>? Languages { get; set; }

        // Career Objective / Summary
        public string? CareerObjective { get; set; }

        // Additional Information
        public string? AdditionalInfo { get; set; }
    }

    public class PersonalInfoDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool? Gender { get; set; }
        public string? Address { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? LinkedIn { get; set; }
        public string? GitHub { get; set; }
        public string? Website { get; set; }
    }

    public class WorkExperienceDto
    {
        public string? CompanyName { get; set; }
        public string? Position { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsCurrentJob { get; set; }
        public string? Description { get; set; }
        public List<string>? Achievements { get; set; }
    }

    public class EducationDto
    {
        public string? InstitutionName { get; set; }
        public string? Degree { get; set; }
        public string? Major { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsCurrent { get; set; }
        public string? Gpa { get; set; }
        public string? Description { get; set; }
    }

    public class SkillDto
    {
        public string? SkillName { get; set; }
        public string? Level { get; set; } // Beginner, Intermediate, Advanced, Expert
        public string? Category { get; set; } // Technical, Soft, Language
    }

    public class ProjectDto
    {
        public string? ProjectName { get; set; }
        public string? Description { get; set; }
        public string? Technologies { get; set; }
        public string? ProjectUrl { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class CertificateDto
    {
        public string? CertificateName { get; set; }
        public string? IssuingOrganization { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? CredentialId { get; set; }
        public string? CredentialUrl { get; set; }
    }

    public class LanguageDto
    {
        public string? LanguageName { get; set; }
        public string? ProficiencyLevel { get; set; } // Basic, Intermediate, Advanced, Native
    }
}

