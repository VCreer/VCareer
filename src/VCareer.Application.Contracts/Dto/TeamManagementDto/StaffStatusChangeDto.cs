using System;

namespace VCareer.Dto.TeamManagementDto
{
    /// <summary>
    /// DTO trả về sau khi thay đổi status của staff
    /// </summary>
    public class StaffStatusChangeDto
    {
        /// <summary>
        /// ID của staff
        /// </summary>
        public Guid StaffId { get; set; }
        
        /// <summary>
        /// Tên đầy đủ
        /// </summary>
        public string FullName { get; set; }
        
        /// <summary>
        /// Email
        /// </summary>
        public string Email { get; set; }
        
        /// <summary>
        /// Status trước khi thay đổi
        /// </summary>
        public bool PreviousStatus { get; set; }
        
        /// <summary>
        /// Status mới
        /// </summary>
        public bool NewStatus { get; set; }
        
        /// <summary>
        /// Hành động thực hiện (Activate/Deactivate)
        /// </summary>
        public string Action { get; set; }
        
        /// <summary>
        /// Lý do thay đổi
        /// </summary>
        public string Reason { get; set; }
        
        /// <summary>
        /// Thời điểm thay đổi
        /// </summary>
        public DateTime ChangeTimestamp { get; set; }
        
        /// <summary>
        /// Người thực hiện (Leader)
        /// </summary>
        public string PerformedBy { get; set; }
        
        /// <summary>
        /// Message mô tả kết quả
        /// </summary>
        public string Message { get; set; }
    }
}
























