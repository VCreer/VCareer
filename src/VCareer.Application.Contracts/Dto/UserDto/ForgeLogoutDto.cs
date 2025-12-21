using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.UserDto
{
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

 }
