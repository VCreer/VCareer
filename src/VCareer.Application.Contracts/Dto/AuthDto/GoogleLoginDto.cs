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
        
        /// <summary>
        /// Role để xác định đăng ký/đăng nhập cho candidate hay recruiter
        /// Values: "candidate" hoặc "recruiter"
        /// Nếu null hoặc empty, mặc định là "candidate"
        /// </summary>
        public string? Role { get; set; }
    }
}
