using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.JwtDto;
using Volo.Abp.Identity;

namespace VCareer.IServices.IAuth
{
    public interface ITokenGenerator
    {
        Task<TokenResponseDto> CreateTokenAsync(IdentityUser user);
        Task<TokenResponseDto?> RefreshAsync(string refreshToken);
        Task CancleAsync(IdentityUser user);
    }
}
