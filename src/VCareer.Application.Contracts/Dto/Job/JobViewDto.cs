using System;
using VCareer.Model;

namespace VCareer.Dto.Job
{

    public class JobViewDto
    {
        public Guid Id { get; set; }
        //public string Slug { get; set; }
        public string Title { get; set; }
        //public string? CompanyLogo { get; set; }
        public string? CompanyName { get; set; }

        /// <summary>
        /// String đã format: "Lương thỏa thuận" hoặc "Lương từ X đến Y triệu"
        /// </summary>
        public string SalaryText { get; set; }

        /// <summary>
        /// Kinh nghiệm (string đã format)
        /// VD: "Không yêu cầu kinh nghiệm", "2 năm kinh nghiệm", "Trên 10 năm kinh nghiệm"
        /// </summary>
        public string ExperienceText { get; set; }

        /// <summary>
        /// Category name (ví dụ: "Backend Developer")
        /// </summary>
        public string? CategoryName { get; set; }

        /// <summary>
        /// Province name (ví dụ: "Hà Nội")
        /// </summary>
        /// //dia chi lam viec
       // public string? WorkLocation { get; set; }

        /// <summary>
        /// District name (ví dụ: "Cầu Giấy")
        /// </summary>
        public string? ProvinceName { get; set; }

        /// <summary>
        /// Địa chỉ cụ thể
        /// </summary>
        //public string? WorkLocation { get; set; }

        /// <summary>
        /// Loại hình: Full-time, Part-time, Remote...
        /// </summary>
        //public EmploymentType EmploymentType { get; set; }

        /// <summary>
        /// Vị trí: Intern, Junior, Senior...
        /// </summary>
        //public PositionType PositionType { get; set; }

        /// <summary>
        /// Tuyển gấp?
        /// </summary>
        public bool IsUrgent { get; set; }

        /// <summary>
        /// Ngày đăng
        /// </summary>
        public DateTime PostedAt { get; set; }

        /// <summary>
        /// Ngày hết hạn
        /// </summary>
        public DateTime ExpiresAt { get; set; }
    }
}



