using System.ComponentModel.DataAnnotations;

namespace VCareer.Dto.TeamManagementDto
{
    /// <summary>
    /// DTO để invite HR Staff mới
    /// </summary>
    public class InviteStaffDto
    {
        /// <summary>
        /// Email của HR Staff cần invite
        /// </summary>
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }
    }
}


