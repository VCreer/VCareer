using System;
using System.Collections.Generic;
using VCareer.Constants;
using VCareer.Model;

namespace VCareer.Dto.Job
{
    /// <summary>
    /// Input DTO cho tìm kiếm job (FE gửi lên)
    /// ⚠️ REDESIGNED theo UI mới (Radio buttons cho Experience và Salary)
    /// </summary>
    public class JobSearchInputDto
    {
        /// <summary>
        /// Từ khóa tìm kiếm (title, description, requirements, benefits...)
        /// </summary>
        public string? Keyword { get; set; }

        /// <summary>
        /// Danh sách Category IDs (FE gửi leaf nodes)
        /// </summary>
        public List<Guid>? CategoryIds { get; set; }

        /// <summary>
        /// Danh sách Province IDs
        /// </summary>
        public List<int>? ProvinceIds { get; set; }

        /// <summary>
        /// Danh sách District IDs
        /// </summary>
        public List<int>? DistrictIds { get; set; }

        // ============================================
        // ✨ FILTER KINH NGHIỆM - Dropdown/Radio (đơn giản hóa)
        // ============================================
        /// <summary>
        /// Filter kinh nghiệm (match exact với ExperienceLevel enum)
        /// null = Tất cả
        /// </summary>
        public ExperienceLevel? ExperienceFilter { get; set; }

        // ============================================
        // ✨ FILTER LƯƠNG - Radio Buttons
        // ============================================
        /// <summary>
        /// Filter lương theo radio buttons
        /// Values: "all", "under10", "10to15", "15to20", "20to30", "30to50", "over50", "deal"
        /// </summary>
        public SalaryFilterType? SalaryFilter { get; set; }

        /// <summary>
        /// Loại hình công việc (Full-time, Part-time, Remote...)
        /// </summary>
        public List<EmploymentType>? EmploymentTypes { get; set; }

        /// <summary>
        /// Vị trí (Intern, Junior, Senior...)
        /// </summary>
        public List<PositionType>? PositionTypes { get; set; }

        /// <summary>
        /// Tuyển gấp?
        /// </summary>
        public bool? IsUrgent { get; set; }

        /// <summary>
        /// Sort by: relevance (default), salary, experience, urgent, updated
        /// </summary>
        public string SortBy { get; set; } = "relevance";

        /// <summary>
        /// Skip count (cho pagination)
        /// </summary>
        public int SkipCount { get; set; } = 0;

        /// <summary>
        /// Max result count (default 20)
        /// </summary>
        public int MaxResultCount { get; set; } = 20;
    }

    // ============================================
    // ✨ ENUM CHO FILTER LƯƠNG
    // ============================================

    /// <summary>
    /// Enum cho filter lương (theo radio buttons UI)
    /// </summary>
    public enum SalaryFilterType
    {
        All = 0,        // Tất cả
        Under10 = 1,    // Dưới 10 triệu
        Range10To15 = 2,// 10 - 15 triệu
        Range15To20 = 3,// 15 - 20 triệu
        Range20To30 = 4,// 20 - 30 triệu
        Range30To50 = 5,// 30 - 50 triệu
        Over50 = 6,     // Trên 50 triệu
        Deal = 7        // Thỏa thuận
    }
}



