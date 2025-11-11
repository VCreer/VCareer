using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.Authentication;
using VCareer.Constants.ErrorCodes;
using VCareer.Dto.AuthDto;
using VCareer.Dto.JwtDto;
using VCareer.OptionConfigs;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Uow;

namespace VCareer.IServices.IAuth
{
    public interface IAuthAppService : IApplicationService
    {
        public Task CandidateRegisterAsync(CandidateRegisterDto input);
        public Task RecruiterRegisterAsync(RecruiterRegisterDto input);
        public Task CreateEmployeeAsync(CreateEmployeeDto input);
        public Task<TokenResponseDto> EmployeeLoginAsync(EmployeeLoginDto input);
        public Task<TokenResponseDto> LoginWithGoogleAsync(GoogleLoginDto input);
        public Task ForgotPasswordAsync(ForgotPasswordDto input);
        public Task ResetPasswordAsync(ResetPasswordDto input);
        public Task LogOutAsync();
        public Task LogOutAllDeviceAsync();
        public Task<TokenResponseDto> RecruiterLoginAsync(LoginDto input);
        public Task<TokenResponseDto> CandidateLoginAsync(LoginDto input);





    }
}
