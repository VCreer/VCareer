using System;
using VCareer.Constants;
using VCareer.Constants.JobConstant;

namespace VCareer.Dto.Job
{
    public class JobViewDetail
    {
        public Guid Id { get; set; }
        public string Slug { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Requirements { get; set; }
        public string? Benefits { get; set; }
        public string? CompanyLogo { get; set; }
        public int CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string SalaryText { get; set; }
        /// VD: "Không yêu cầu kinh nghiệm", "2 năm kinh nghiệm", "Trên 10 năm kinh nghiệm"
        public string ExperienceText { get; set; }
        public int Quantity { get; set; }
        public string? CategoryName { get; set; }
        public string? ProvinceName { get; set; }
        public string? DistrictName { get; set; }
        public string? WorkLocation { get; set; }
        /// Loại hình: Full-time, Part-time, Remote...
        public EmploymentType EmploymentType { get; set; }
        /// Vị trí: Intern, Junior, Senior...
        public PositionType PositionType { get; set; }
        public bool IsUrgent { get; set; }
        public DateTime PostedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int ApplyCount { get; set; }
    }
}



