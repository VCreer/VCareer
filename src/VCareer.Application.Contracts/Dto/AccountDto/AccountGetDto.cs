using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.UserDto
{
    public class AccountGetDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsEmailConfirmed { get; set; } = false;
        public bool IsPhoneNumberConfirmed { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public bool IsExternal { get; set; } = false;
    }
}
