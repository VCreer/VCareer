using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Profile
{
    /// <summary>
    /// DTO kết quả tìm kiếm ứng viên
    /// </summary>
    public class CandidateSearchResultDto : EntityDto<Guid>
    {
        public string Name { get; set; }
        public Guid CandidateUserId { get; set; }
        public Guid? DefaultCvId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        
        // Thông tin nghề nghiệp
        public string? JobTitle { get; set; }
        public string? Skills { get; set; }
        public int? Experience { get; set; }
        public decimal? Salary { get; set; }
        public string? WorkLocation { get; set; }
        public string? Location { get; set; }
        
        // Thông tin khác
        public bool? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool Status { get; set; }
        
        // Thống kê (có thể lấy từ các bảng khác)
        public int ViewCount { get; set; }
        public int ContactOpenCount { get; set; }
        public bool IsSeekingJob { get; set; }
        public DateTime? LastUpdatedTime { get; set; }
        
        // Chi tiết kinh nghiệm (có thể lấy từ CV hoặc bảng khác)
        public List<ExperienceDetailDto>? ExperienceDetails { get; set; }
        
        // Học vấn (có thể lấy từ CV hoặc bảng khác)
        public string? Education { get; set; }
    }

    /// <summary>
    /// DTO chi tiết kinh nghiệm
    /// </summary>
    public class ExperienceDetailDto
    {
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? Duration { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class SendConnectionRequestDto
    {
        public Guid CandidateProfileId { get; set; }
        public string CompanyName { get; set; }
        public string JobTitle { get; set; }
        public string Message { get; set; }
        public List<string> Emails { get; set; } = new List<string>();
    }
}

