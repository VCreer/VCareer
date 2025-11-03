using System;

namespace VCareer.Dto.TeamManagementDto
{
    /// <summary>
    /// DTO cho item trong danh sách staff
    /// </summary>
    public class StaffListItemDto
    {
        /// <summary>
        /// User ID của staff (dùng cho StaffId khi deactivate/activate)
        /// </summary>
        public Guid UserId { get; set; }
        
        /// <summary>
        /// Recruiter Profile ID
        /// </summary>
        public Guid RecruiterProfileId { get; set; }
        
        /// <summary>
        /// Họ tên đầy đủ
        /// </summary>
        public string FullName { get; set; }
        
        /// <summary>
        /// Email
        /// </summary>
        public string Email { get; set; }
        
        /// <summary>
        /// Có phải Leader không
        /// </summary>
        public bool IsLead { get; set; }
        
        /// <summary>
        /// Trạng thái (true = active, false = inactive)
        /// </summary>
        public bool Status { get; set; }
        
        /// <summary>
        /// Company ID
        /// </summary>
        public int CompanyId { get; set; }
        
        /// <summary>
        /// Company Name
        /// </summary>
        public string CompanyName { get; set; }
    }
}

