using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
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
        /// Mức lương tối thiểu (VNĐ) - Dùng để filter
        /// </summary>
        public decimal? SalaryMin { get; set; }

        /// <summary>
        /// Mức lương tối đa (VNĐ) - Dùng để filter
        /// </summary>
        public decimal? SalaryMax { get; set; }

        /// <summary>
        /// Lương có thể thỏa thuận (checkbox)
        /// TRUE = Hiển thị "Lương thỏa thuận"
        /// FALSE = Hiển thị "Lương từ X đến Y triệu"
        /// </summary>
        public bool SalaryDeal { get; set; } = false;

        /// <summary>
        /// Text hiển thị lương (string đã format)
        /// VD: "Lương thỏa thuận" hoặc "Lương từ 15 đến 30 triệu"
        /// ⚠️ Tự động generate khi create/update job
        /// </summary>
        public string SalaryText { get; set; }

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
        /// Yêu cầu kinh nghiệm (enum - đơn giản hóa)
        /// None = Không yêu cầu, Year1 = 1 năm, Year2 = 2 năm, ..., Over10 = Trên 10 năm
        /// </summary>
        public ExperienceLevel Experience { get; set; } = ExperienceLevel.None;

        public string? ExperienceText { get; set; }

        public int Quantity { get; set; }

        public int ViewCount { get; set; }

        #endregion

        #region Work Time

        public string WorkTime { get; set; }

        #endregion

        #region Location

        /// <summary>
        /// Địa chỉ cụ thể nơi làm việc
        /// </summary>
        public string WorkLocation { get; set; }

     

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


        /// <summary>
        /// ID Tỉnh/Thành phố
        /// </summary>
        public int ProvinceId { get; set; }

        /// <summary>
        /// ID Quận/Huyện
        /// </summary>
        public int DistrictId { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Navigation property - Nhà tuyển dụng
        /// </summary>
        public virtual RecruiterProfile RecruiterProfile { get; set; }

        public virtual Province? Province { get; set; }

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

        /// <summary>
        /// Generate salary text từ SalaryDeal, SalaryMin, SalaryMax
        /// ⚠️ Gọi method này TRƯỚC KHI LƯU vào database
        /// </summary>
        public void GenerateSalaryText()
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
        }

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
