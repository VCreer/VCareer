using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.UserExtensionDto
{
    public class ForgeLogoutDto
    {
        string UserId { get; set; }
    }

    public class EmployeeAccountCreateDto
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        public string? Phone { get; set; }
        public List<string>? Roles { get; set; }
        public List<string>? EmployeePermissions { get; set; }
    }

    public class HrStaffCreateDto
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        public string? Phone { get; set; }
        public List<string>? RecruiterPermissions { get; set; }
    }

    public class SetAccountActiveStatusDto
    {
        [Required]
        public string UserId { get; set; }
        [Required]
        public bool IsActive { get; set; }
    }

    public class SetAccountLockStatusDto
    {
        [Required]
        public string UserId { get; set; }
        [Required]
        public bool IsLock { get; set; }
    }

    public class IpAddressDto
    {
    }
}
