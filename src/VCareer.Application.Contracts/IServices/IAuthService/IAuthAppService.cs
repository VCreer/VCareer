using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.AuthDto;
using VCareer.Dto.JwtDto;
using Volo.Abp.Application.Services;
using Volo.Abp.DependencyInjection;

namespace VCareer.IServices.IAuth
{
    public interface IAuthAppService : IApplicationService
    {
        public Task RegisterAsync(RegisterDto input);
        public Task<TokenResponseDto> LoginAsync(LoginDto input);
        public Task<TokenResponseDto> LoginWithGoogleAsync(GoogleLoginDto input);
        public Task ForgotPasswordAsync(ForgotPasswordDto input);
        public Task ResetPasswordAsync(ResetPasswordDto input);

        public Task LogOutAsync();

    }
}
