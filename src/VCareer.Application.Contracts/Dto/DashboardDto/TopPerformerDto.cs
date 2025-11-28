using System;

namespace VCareer.Dto.DashboardDto
{
    /// <summary>
    /// DTO cho nhân viên có hiệu suất cao nhất
    /// </summary>
    public class TopPerformerDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Category { get; set; } // e.g., "Most Jobs Posted", "Most Candidates Approved", etc.
        public int Value { get; set; }
        public string Description { get; set; }
    }
}






































