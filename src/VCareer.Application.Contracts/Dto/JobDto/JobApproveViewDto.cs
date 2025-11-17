using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.JobDto
{
    public class JobApproveViewDto
    {
        public Guid Id { get; set; }
        #region Basic Job Description
        public string? CompanyImageUrl { get; set; }
        public int CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public string? Description { get; set; }

        public string? Requirements { get; set; }
        public string? Benefits { get; set; }

        #endregion
        #region Detail Job Description
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public bool SalaryDeal { get; set; } = false; // Lương thỏa thuận
        public EmploymentType EmploymentType { get; set; }// (Full-time, Part-time, Intern, etc.)
        public PositionType PositionType { get; set; }    /// Cấp bậc vị trí
        public ExperienceLevel Experience { get; set; } = ExperienceLevel.None;
        public string? ExperienceText { get; set; }
        public string? WorkTime { get; set; }
        public string ProvinceName { get; set; } // code thanh pho
        public string? WardName { get; set; } // code xa phuong
        public string? WorkLocation { get; set; } // Địa chỉ cụ thể nơi làm việc
        public int Quantity { get; set; }
        #endregion

        #region Approve job 
        public JobStatus Status { get; set; }
        public JobPriorityLevel PriorityLevel { get; set; }
        public RecruiterLevel RecruiterLevel { get; set; }
        public RiskJobLevel RiskJobLevel { get; set; } = RiskJobLevel.NonCalculated;
        public string? RejectedReason { get; set; } // chỉ dùng để gửi email cho recruiter, job được accept cũng có thể có trường này 
        #endregion
        public DateTime PostedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }

        public Guid JobCategoryId { get; set; }
        public string CategoryName { get; set; }
    }
}
