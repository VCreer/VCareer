using System;
using System.Collections.Generic;
using VCareer.Constants;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    /// Input DTO cho tìm kiếm job (FE gửi lên)
    /// ⚠️ REDESIGNED theo UI mới (Radio buttons cho Experience và Salary)
    


    //cần phải sửa lại vì có nhiều trường ko có trong job
    public class JobSearchInputDto
    {
        /// Từ khóa tìm kiếm (title, description, requirements, benefits...)
        public string? Keyword { get; set; }

        /// Danh sách Category IDs (FE gửi leaf nodes)
        public List<Guid>? CategoryIds { get; set; }

        /// Danh sách Province IDs
        public List<int>? ProvinceIds { get; set; }

        /// Danh sách District IDs
        public List<int>? DistrictIds { get; set; }

        // ✨ FILTER KINH NGHIỆM - Dropdown/Radio (đơn giản hóa)
        /// Filter kinh nghiệm (match exact với ExperienceLevel enum)
        /// null = Tất cả
        public ExperienceLevel? ExperienceFilter { get; set; }

        // ✨ FILTER LƯƠNG - Radio Buttons
        /// Filter lương theo radio buttons
        /// Values: "all", "under10", "10to15", "15to20", "20to30", "30to50", "over50", "deal"
        public SalaryFilterType? SalaryFilter { get; set; }

        /// Loại hình công việc (Full-time, Part-time, Remote...)
        public List<EmploymentType>? EmploymentTypes { get; set; }

        /// Vị trí (Intern, Junior, Senior...)
        public List<PositionType>? PositionTypes { get; set; }

        /// Tuyển gấp?
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



