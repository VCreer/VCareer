using System;

namespace VCareer.Dto.DashboardDto
{
    /// <summary>
    /// DTO để filter dữ liệu dashboard
    /// </summary>
    public class DashboardFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Guid? StaffId { get; set; } // Lọc theo một staff cụ thể
        public bool IncludeInactive { get; set; } = false; // Có bao gồm staff không active không
        public string SortBy { get; set; } = "FullName"; // Sắp xếp theo: FullName, TotalActivities, ApprovalRate, etc.
        public bool Descending { get; set; } = false;
    }
}




























