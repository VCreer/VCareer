using System;
using System.Collections.Generic;
using VCareer.Model;

namespace VCareer.Dto.Job
{
    /// <summary>
    /// DTO hiển thị chi tiết job (bao gồm mô tả, yêu cầu, quyền lợi...)
    /// </summary>
    public class JobViewDetail
    {
        public Guid Id { get; set; }
        public string Slug { get; set; }
        public string Title { get; set; }

        /// <summary>
        /// Mô tả công việc (HTML content)
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Yêu cầu công việc (HTML content)
        /// </summary>
        public string Requirements { get; set; }

        /// <summary>
        /// Quyền lợi (HTML content)
        /// </summary>
        public string? Benefits { get; set; }

        /// <summary>
        /// Logo công ty
        /// </summary>
        public string? CompanyLogo { get; set; }

        /// <summary>
        /// Tên công ty
        /// </summary>
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
        /// Số lượng tuyển
        /// </summary>
        public int Quantity { get; set; }



        /// <summary>
        /// Category name (ví dụ: "Backend Developer")
        /// </summary>
        public string? CategoryName { get; set; }

        /// <summary>
        /// Province name (ví dụ: "Hà Nội")
        /// </summary>
        public string? ProvinceName { get; set; }

        /// <summary>
        /// District name (ví dụ: "Cầu Giấy")
        /// </summary>
        public string? DistrictName { get; set; }

        /// <summary>
        /// Địa chỉ cụ thể
        /// </summary>
        public string? WorkLocation { get; set; }

        /// <summary>
        /// Loại hình: Full-time, Part-time, Remote...
        /// </summary>
        public EmploymentType EmploymentType { get; set; }

        /// <summary>
        /// Vị trí: Intern, Junior, Senior...
        /// </summary>
        public PositionType PositionType { get; set; }

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

        /// <summary>
        /// Lượt xem
        /// </summary>
        public int ViewCount { get; set; }

        /// <summary>
        /// Lượt apply
        /// </summary>
        public int ApplyCount { get; set; }

        /// <summary>
        /// Trình độ học vấn yêu cầu
        /// </summary>
        public EducationLevel Education { get; set; }

        /// <summary>
        /// Chuỗi danh mục (từ cấp 1 -> cấp 3) của job hiện tại
        /// </summary>
        public List<CategoryItemDto> CategoryPath { get; set; } = new List<CategoryItemDto>();

        /// <summary>
        /// Job đã được người dùng hiện tại lưu (favorite) hay chưa
        /// </summary>
        public bool IsSaved { get; set; } = false;
    }
}



