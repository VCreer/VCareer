using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    public class JobPostCreateDto
    {
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public string? Requirements { get; set; }
        public string? Benefits { get; set; }

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

        public DateTime? ExpiresAt { get; set; }
        public Guid JobCategoryId { get; set; }
    }

    public class PostJobDto
    {
        public Guid JobId { get; set; }

    }
}
