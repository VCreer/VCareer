using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.AuthDto
{
    public class CreateEmployeeDto
    {
        [Required(ErrorMessage = "Please enter a valid email address")]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string[] EmployeeRoles { get; set; } = new string[100];
    }
}
