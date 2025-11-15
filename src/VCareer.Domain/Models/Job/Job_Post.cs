using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.Constants.JobConstant;
using VCareer.Models.Companies;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Job_Post : FullAuditedAggregateRoot<Guid>
    {
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
        public int ProvinceCode { get; set; } // code thanh pho
        public int? WardCode { get; set; } // code xa phuong
        public string? WorkLocation { get; set; } // Địa chỉ cụ thể nơi làm việc
        public int Quantity { get; set; }
        #endregion

        #region Status
        public JobStatus Status { get; set; }
        #endregion

        #region Approve job 
        public RiskJobLevel RiskJobLevel { get; set; } = RiskJobLevel.NonCalculated;
        public string? RejectedReason { get; set; } // chỉ dùng để gửi email cho recruiter, job được accept cũng có thể có trường này 
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApproveAt { get; set; }
        #endregion
        public int ViewCount { get; set; }
        public DateTime PostedAt { get => CreationTime; set => CreationTime = value; }
        public DateTime? ExpiresAt { get; set; }
        public int ApplyCount { get; set; } = 0; // Số lượng ứng viên đã nộp hồ sơ
        public Guid RecruiterId { get; set; }
        public Guid JobCategoryId { get; set; }


        #region Navigate atribute
        public virtual RecruiterProfile RecruiterProfile { get; set; }

        public virtual Job_Category JobCategory { get; set; }

        public virtual ICollection<JobPostTag> JobPostingTags { get; set; } = new List<JobPostTag>();
        public virtual ICollection<Job_Priority> Job_Priorities { get; set; } = new List<Job_Priority>(); // List priority of job>
        #endregion

        #region Helper Methods

        public bool IsExpired()
        {
            return ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;
        }

        public bool IsActive()
        {
            return Status == JobStatus.Open && !IsExpired();
        }

        /// <summary>
        /// Generate salary text từ SalaryDeal, SalaryMin, SalaryMax
        /// ⚠️ Gọi method này TRƯỚC KHI LƯU vào database
        /// </summary>
   /*     public void GenerateSalaryText()
        {
            if (SalaryDeal)
            {
                SalaryText = "Lương thỏa thuận";
            }
            else if (SalaryMin.HasValue && SalaryMax.HasValue)
            {
                // Convert VNĐ sang triệu
                var minInMillion = SalaryMin.Value / 1_000_000;
                var maxInMillion = SalaryMax.Value / 1_000_000;
                SalaryText = $"Lương từ {minInMillion:0.#} đến {maxInMillion:0.#} triệu";
            }
            else if (SalaryMin.HasValue)
            {
                var minInMillion = SalaryMin.Value / 1_000_000;
                SalaryText = $"Lương từ {minInMillion:0.#} triệu";
            }
            else if (SalaryMax.HasValue)
            {
                var maxInMillion = SalaryMax.Value / 1_000_000;
                SalaryText = $"Lương lên đến {maxInMillion:0.#} triệu";
            }
            else
            {
                SalaryText = "Lương thỏa thuận";
            }
        }*/

        /// <summary>
        /// Generate experience text từ Experience enum
        /// ⚠️ Gọi method này TRƯỚC KHI LƯU vào database
        /// </summary>
        public void GenerateExperienceText()
        {
            ExperienceText = Experience switch
            {
                ExperienceLevel.None => "Không yêu cầu kinh nghiệm",
                ExperienceLevel.Under1 => "Dưới 1 năm kinh nghiệm",
                ExperienceLevel.Year1 => "1 năm kinh nghiệm",
                ExperienceLevel.Year2 => "2 năm kinh nghiệm",
                ExperienceLevel.Year3 => "3 năm kinh nghiệm",
                ExperienceLevel.Year4 => "4 năm kinh nghiệm",
                ExperienceLevel.Year5 => "5 năm kinh nghiệm",
                ExperienceLevel.Year6 => "6 năm kinh nghiệm",
                ExperienceLevel.Year7 => "7 năm kinh nghiệm",
                ExperienceLevel.Year8 => "8 năm kinh nghiệm",
                ExperienceLevel.Year9 => "9 năm kinh nghiệm",
                ExperienceLevel.Year10 => "10 năm kinh nghiệm",
                ExperienceLevel.Over10 => "Trên 10 năm kinh nghiệm",
                _ => "Không yêu cầu kinh nghiệm"
            };
        }

        #endregion



    }
}
