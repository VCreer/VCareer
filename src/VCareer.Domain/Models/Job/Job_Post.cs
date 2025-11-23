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
using VCareer.Models.JobCategory;
using VCareer.Models.Subcription;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Job_Post : FullAuditedAggregateRoot<Guid>
    {

        //public Job_Post(Guid id) : base(id) { }
        #region Basic Job Description
        public Guid? RecruitmentCampaignId { get; set; }
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
        public DateTime PostedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public int ApplyCount { get; set; } = 0; // Số lượng ứng viên đã nộp hồ sơ
        public Guid RecruiterId { get; set; }
        public Guid JobCategoryId { get; set; }


        #region Navigate atribute
        public virtual RecruiterProfile RecruiterProfile { get; set; }
        public virtual RecruitmentCampaign RecruitmentCampaign { get; set; }
        public virtual Job_Category JobCategory { get; set; }
        public virtual ICollection<JobTag> JobTags { get; set; } = new List<JobTag>();
        public virtual Job_Priority Job_Priority { get; set; }  // List priority of job>
        public virtual ICollection<EffectingJobService> EffectingJobServices { get; set; } = new List<EffectingJobService>(); // List priority of job>
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


        #endregion



    }
}
