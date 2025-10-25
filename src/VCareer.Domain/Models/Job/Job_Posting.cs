using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using VCareer.Model;
using VCareer.Models.Companies;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Job_Posting : FullAuditedAggregateRoot<Guid>
    {
        #region Basic Information

        /// <summary>
        /// Hình ảnh đại diện
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// Tiêu đề công việc
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Slug cho URL (SEO-friendly)
        /// </summary>
        public string Slug { get; set; }

        /// <summary>
        /// Mô tả công việc (HTML)
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Yêu cầu ứng viên (HTML)
        /// </summary>
        public string Requirements { get; set; }

        /// <summary>
        /// Quyền lợi ứng viên (HTML)
        /// </summary>
        public string Benefits { get; set; }

        #endregion

        #region Salary Information

        /// <summary>
        /// Mức lương tối thiểu (VNĐ)
        /// </summary>
        public decimal? SalaryMin { get; set; }

        /// <summary>
        /// Mức lương tối đa (VNĐ)
        /// </summary>
        public decimal? SalaryMax { get; set; }

        /// <summary>
        /// Lương có thể thỏa thuận
        /// </summary>
        public bool SalaryDeal { get; set; } = false;

        #endregion

        #region Work Details

        /// <summary>
        /// Hình thức làm việc (Full-time, Part-time, Intern, etc.)
        /// </summary>
        public EmploymentType EmploymentType { get; set; }

        /// <summary>
        /// Cấp bậc vị trí
        /// </summary>
        public PositionType PositionType { get; set; }

        /// <summary>
        /// Số năm kinh nghiệm tối thiểu
        /// </summary>
        public int? ExperienceYearsMin { get; set; }

        /// <summary>
        /// Số năm kinh nghiệm tối đa
        /// </summary>
        public int? ExperienceYearsMax { get; set; }

        #endregion

        #region Work Time

        /// <summary>
        /// Thời gian làm việc bắt đầu (giờ trong ngày)
        /// VD: 08:00
        /// </summary>
        public TimeSpan? WorkTimeStart { get; set; }

        /// <summary>
        /// Thời gian làm việc kết thúc (giờ trong ngày)
        /// VD: 17:00
        /// </summary>
        public TimeSpan? WorkTimeEnd { get; set; }

        /// <summary>
        /// Thời gian làm việc có thể thỏa thuận
        /// </summary>
        public bool TimeDeal { get; set; } = false;

        #endregion

        #region Location

        /// <summary>
        /// Địa chỉ cụ thể nơi làm việc
        /// </summary>
        public string WorkLocation { get; set; }

        /// <summary>
        /// ID Tỉnh/Thành phố
        /// </summary>
        public int ProvinceId { get; set; }

        /// <summary>
        /// ID Quận/Huyện
        /// </summary>
        public int DistrictId { get; set; }

        /// <summary>
        /// Navigation property - Tỉnh/Thành phố
        /// </summary>


        #endregion

        #region Status & Dates

        /// <summary>
        /// Trạng thái bài đăng
        /// </summary>
        public JobStatus Status { get; set; }

        /// <summary>
        /// Ngày đăng (dùng CreationTime từ base class)
        /// </summary>
        public DateTime PostedAt
        {
            get => CreationTime;
            set => CreationTime = value;
        }

        /// <summary>
        /// Ngày hết hạn
        /// </summary>
        public DateTime? ExpiresAt { get; set; }

        /// <summary>
        /// Tính chất công việc gấp
        /// </summary>
        public bool IsUrgent { get; set; } = false;

        #endregion

        #region Statistics

        /// <summary>
        /// Số lượng ứng viên đã nộp hồ sơ
        /// </summary>
        public int ApplyCount { get; set; } = 0;

        #endregion

        #region Foreign Keys

        /// <summary>
        /// ID Nhà tuyển dụng
        /// </summary>
        public Guid RecruiterId { get; set; }

        /// <summary>
        /// ID Ngành nghề
        /// </summary>
        public Guid JobCategoryId { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Navigation property - Nhà tuyển dụng
        /// </summary>
        public virtual RecruiterProfile RecruiterProfile { get; set; }

        /// <summary>
        /// Navigation property - Ngành nghề
        /// </summary>
        public virtual Job_Category JobCategory { get; set; }

        /// <summary>
        /// Navigation property - Danh sách tags
        /// </summary>
        public virtual ICollection<JobPostingTag> JobPostingTags { get; set; } = new List<JobPostingTag>();

        #endregion

        #region Helper Methods

        /// <summary>
        /// Check xem job có còn hạn không
        /// </summary>
        public bool IsExpired()
        {
            return ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;
        }

        /// <summary>
        /// Check xem job có active không
        /// </summary>
        public bool IsActive()
        {
            return Status == JobStatus.Open && !IsExpired();
        }

        #endregion



    }
}
