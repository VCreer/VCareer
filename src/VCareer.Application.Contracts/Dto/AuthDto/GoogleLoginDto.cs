using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.Authentication.AuthenticationConstants;

namespace VCareer.Dto.AuthDto
{
    public class GoogleLoginDto
    {
        [Required]
        public string IdToken { get; set; }
   /*     [Required]
        public ScreenRoleType Type{ get; set; }*/
    }
}
