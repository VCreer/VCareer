using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.JwtDto
{
    public class TokenResponseDto
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string ExpireMinuteAcesstoken { get; set; }
        public string ExpireHourRefreshToken { get; set; }

    }
}
