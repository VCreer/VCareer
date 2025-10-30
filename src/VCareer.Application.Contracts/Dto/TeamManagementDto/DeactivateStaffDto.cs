using System;
using System.ComponentModel.DataAnnotations;

namespace VCareer.Dto.TeamManagementDto
{
    /// <summary>
    /// DTO để vô hiệu hóa HR Staff
    /// </summary>
    public class DeactivateStaffDto
    {
        /// <summary>
        /// ID của staff cần deactivate (RecruiterProfileId)
        /// </summary>
        [Required(ErrorMessage = "Staff ID là bắt buộc")]
        public Guid StaffId { get; set; }
        
        /// <summary>
        /// Lý do deactivate
        /// </summary>
        [Required(ErrorMessage = "Lý do deactivate là bắt buộc")]
        [StringLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
        public string Reason { get; set; }
        
        /// <summary>
        /// Có gửi notification không
        /// </summary>
        public bool SendNotification { get; set; } = true;
        
        /// <summary>
        /// Ngày hiệu lực (nếu để null thì hiệu lực ngay)
        /// </summary>
        public DateTime? EffectiveDate { get; set; }
        
        /// <summary>
        /// Ghi chú thêm
        /// </summary>
        [StringLength(1000, ErrorMessage = "Ghi chú không được vượt quá 1000 ký tự")]
        public string? Notes { get; set; }
    }
}


