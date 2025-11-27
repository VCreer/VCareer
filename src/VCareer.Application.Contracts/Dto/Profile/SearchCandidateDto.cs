using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Profile
{
    /// <summary>
    /// DTO để tìm kiếm ứng viên dựa trên các tiêu chí
    /// </summary>
    public class SearchCandidateInputDto : PagedAndSortedResultRequestDto
    {
        /// <summary>
        /// Từ khóa tìm kiếm (tìm trong JobTitle, Skills, Location)
        /// </summary>
        [StringLength(500)]
        public string? Keyword { get; set; }

        /// <summary>
        /// Vị trí chuyên môn (JobTitle)
        /// </summary>
        [StringLength(200)]
        public string? JobTitle { get; set; }

        /// <summary>
        /// Kỹ năng (tìm trong Skills field)
        /// </summary>
        [StringLength(2000)]
        public string? Skills { get; set; }

        /// <summary>
        /// Kinh nghiệm tối thiểu (số năm)
        /// </summary>
        [Range(0, 100)]
        public int? MinExperience { get; set; }

        /// <summary>
        /// Kinh nghiệm tối đa (số năm)
        /// </summary>
        [Range(0, 100)]
        public int? MaxExperience { get; set; }

        /// <summary>
        /// Mức lương tối thiểu mong muốn
        /// </summary>
        [Range(0, 9999999999999999.99)]
        public decimal? MinSalary { get; set; }

        /// <summary>
        /// Mức lương tối đa mong muốn
        /// </summary>
        [Range(0, 9999999999999999.99)]
        public decimal? MaxSalary { get; set; }

        /// <summary>
        /// Địa điểm làm việc
        /// </summary>
        [StringLength(500)]
        public string? WorkLocation { get; set; }

        /// <summary>
        /// Phạm vi tìm kiếm: Vị trí ứng tuyển
        /// </summary>
        public bool SearchInJobTitle { get; set; } = true;

        /// <summary>
        /// Phạm vi tìm kiếm: Hoạt động (đang tìm việc)
        /// </summary>
        public bool SearchInActivity { get; set; } = false;

        /// <summary>
        /// Phạm vi tìm kiếm: Học vấn
        /// </summary>
        public bool SearchInEducation { get; set; } = false;

        /// <summary>
        /// Phạm vi tìm kiếm: Kinh nghiệm
        /// </summary>
        public bool SearchInExperience { get; set; } = false;

        /// <summary>
        /// Phạm vi tìm kiếm: Kỹ năng
        /// </summary>
        public bool SearchInSkills { get; set; } = false;

        /// <summary>
        /// Phân loại CV: all, unseen, seen
        /// </summary>
        public string? CvClassification { get; set; } // "all", "unseen", "seen"

        /// <summary>
        /// Ưu tiên hiển thị: newest, seeking, experienced, suitable
        /// </summary>
        public string? DisplayPriority { get; set; } = "newest"; // "newest", "seeking", "experienced", "suitable"
    }
}

