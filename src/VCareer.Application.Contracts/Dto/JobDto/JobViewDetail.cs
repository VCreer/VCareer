using System;
using VCareer.Constants;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.Job
{
    public class JobViewDetail
    {
        public Guid Id { get; set; }
        public string? CompanyImageUrl { get; set; }
        public int CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public string? Description { get; set; }

        public string? Requirements { get; set; }
        public string? Benefits { get; set; }

        #region Detail Job Description
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public bool SalaryDeal { get; set; } = false; // Lương thỏa thuận
        public EmploymentType EmploymentType { get; set; }// (Full-time, Part-time, Intern, etc.)
        public PositionType PositionType { get; set; }    /// Cấp bậc vị trí
        public ExperienceLevel Experience { get; set; } = ExperienceLevel.None;
        public string? WorkTime { get; set; }
        public int ProvinceCode { get; set; } // code thanh pho
        public int? WardCode { get; set; } // code xa phuong
        public string? WorkLocation { get; set; } // Địa chỉ cụ thể nơi làm việc
        public int Quantity { get; set; }
        #endregion

        public int ViewCount { get; set; }
        public DateTime PostedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public int ApplyCount { get; set; } = 0; // Số lượng ứng viên đã nộp hồ sơ
        public Guid JobCategoryId { get; set; }
    }
}



