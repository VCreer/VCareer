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
        public Guid Id { get; set; }
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

    public class JobRequestViewDto
    {
        public string? SearchField{ get; set; }
        public JobStatus? Status { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
      }

    public class JobViewManageDetailDto
    {
        public Guid Id { get; set; }
        public string? CompanyImageUrl { get; set; }
        public int CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? Title { get; set; }
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
        public JobStatus Status { get; set; }
        public RiskJobLevel RiskJobLevel { get; set; } = RiskJobLevel.NonCalculated;
        public string? RejectedReason { get; set; } // chỉ dùng để gửi email cho recruiter, job được accept cũng có thể có trường này 
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApproveAt { get; set; }
        public DateTime PostedAt { get; set; } = DateTime.UtcNow;
        public Guid RecruiterId { get; set; }
        public Guid JobCategoryId { get; set; }

    }

}
