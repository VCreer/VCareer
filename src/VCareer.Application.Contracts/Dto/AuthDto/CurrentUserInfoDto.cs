using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.AuthDto
{
   public  class CurrentUserInfoDto
    {
        public Guid? UserId { get; set; }
        public string? Email { get; set; }
        public ICollection<string>? Roles { get; set; }
        public string? FullName { get; set; }
    }
}
