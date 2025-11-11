using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    public class JobViewDto
    {
        public string? CompanyImageUrl { get; set; }
        public int CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string Title { get; set; }
        public JobStatus Status { get; set; }
        public string JobId { get; }
        public DateTime? ExpiresAt { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public bool SalaryDeal { get; set; } = false; // Lương thỏa thuận
        public int ProvinceCode { get; set; } // code thanh pho
        public int DistrictCode { get; set; } // code Quận/Huyện
        public EmploymentType EmploymentType { get; set; }// (Full-time, Part-time, Intern, etc.)
        public PositionType PositionType { get; set; }    /// Cấp bậc vị trí
        public ExperienceLevel Experience { get; set; } = ExperienceLevel.None;
        public Guid JobCategoryId { get; set; }
    }
}
