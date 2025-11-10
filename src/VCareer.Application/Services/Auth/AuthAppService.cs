using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.ErrorCodes;
using VCareer.Dto.AuthDto;
using VCareer.Dto.JwtDto;
using VCareer.IServices.IAuth;
using VCareer.OptionConfigs;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.Identity.AspNetCore;
using Volo.Abp.TextTemplating;
using Volo.Abp.Uow;
using Volo.Abp.Users;
using static Volo.Abp.UI.Navigation.DefaultMenuNames.Application;
using IdentityUser = Volo.Abp.Identity.IdentityUser;




namespace VCareer.Services.Auth
{
    public class AuthAppService : ApplicationService, IAuthAppService
    {
        private readonly IdentityUserManager _identityManager;
        private readonly SignInManager<Volo.Abp.Identity.IdentityUser> _signInManager;
        private readonly ITokenGenerator _tokenGenerator;
        private readonly IEmailSender _emailSender;
        private readonly IdentityRoleManager _roleManager;
        private readonly ITemplateRenderer _templateRenderer;
        private readonly GoogleOptions _googleOptions;
        private readonly ICurrentUser _currentUser;

        public AuthAppService(
            IdentityUserManager identityManager,
            SignInManager<Volo.Abp.Identity.IdentityUser> signInManager,
            ITokenGenerator tokenGenerator,
            ICurrentUser currentUser,
            IEmailSender emailSender,
            ITemplateRenderer templateRenderer,
            IdentityRoleManager roleManager,
            IOptions<GoogleOptions> googleOptions)
        {
            _identityManager = identityManager;
            _signInManager = signInManager;
            _tokenGenerator = tokenGenerator;
            _currentUser = currentUser;
            _emailSender = emailSender;
            _templateRenderer = templateRenderer;
            _roleManager = roleManager;
            _googleOptions = googleOptions.Value;
        }

        public Task CandidateRegisterAsync(CandidateRegisterDto input)
        {
            throw new NotImplementedException();
        }

        public async Task ForgotPasswordAsync(ForgotPasswordDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new UserFriendlyException("Email not found");

            var token = await _identityManager.GeneratePasswordResetTokenAsync(user);

            var resetLink = $"https://your-frontend-url/reset-password?email={Uri.EscapeDataString(input.Email)}&token={Uri.EscapeDataString(token)}";

            var body = await _templateRenderer.RenderAsync(
                 "Abp.StandardEmailTemplates.Message",
            new { message = $"Nhấn vào liên kết để đặt lại mật khẩu: <a href='{resetLink}'>Reset Password</a>" }
                );

            await _emailSender.SendAsync(user.Email, "Forgot Password!", body);
        }

        public async Task<TokenResponseDto> LoginAsync(LoginDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new UserFriendlyException("Email not found");

            // nếu đặt true ở hàm check pass thì nếu đăng nhập sai thì sẽ tạm thời kháo tài khoản 
            var check = await _signInManager.CheckPasswordSignInAsync(user, input.Password, false);
            if (!check.Succeeded) throw new UserFriendlyException("Invalid Password");

            /*   await _signInManager.SignInAsync(user, true);*/// đang lỗi khi chạy fe

            return await _tokenGenerator.CreateTokenAsync(user);
        }

        public async Task<TokenResponseDto> LoginWithGoogleAsync(GoogleLoginDto input)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(input.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _googleOptions.ClientId }
            });
            var user = await _identityManager.FindByEmailAsync(payload.Email);

            if (user != null)
            {
                user = new IdentityUser(id: Guid.NewGuid(), userName: payload.Email, email: payload.Email)
                {
                    IsExternal = true,
                };

                var result = await _identityManager.CreateAsync(user);
                if (!result.Succeeded) throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));
            }
            return await _tokenGenerator.CreateTokenAsync(user);
        }

        public async Task LogOutAllDeviceAsync()
        {
            if (!_currentUser.IsAuthenticated) return;

            // Sử dụng TokenClaimsHelper để lấy UserId an toàn
            var userId = _currentUser.GetId();
                if (userId == null || userId == Guid.Empty)
            {
                throw new UserFriendlyException("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");
            }

            var user = await _identityManager.FindByIdAsync(userId.Value.ToString());
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            // Update security stamp để invalidate tất cả tokens cũ (logout tất cả devices)
            await _identityManager.UpdateSecurityStampAsync(user);
        }


        [Authorize]
        [IgnoreAntiforgeryToken]
        public async Task LogOutAsync()
        {
            if (!_currentUser.IsAuthenticated) return;

            // Sử dụng TokenClaimsHelper để lấy UserId an toàn
            var userId = _currentUser.GetId();
            if (userId == null || userId == Guid.Empty)
            {
                throw new UserFriendlyException("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");
            }

            var user = await _identityManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            // Revoke tất cả refresh tokens của user (logout)
            await _tokenGenerator.CancleAsync(user);
        }

        public Task RecruiterRegisterAsync(RecruiterRegisterDto input)
        {
            throw new NotImplementedException();
        }

        /*   [UnitOfWork]
           public async Task RegisterAsync(RegisterDto input)
           {
               if (await _identityManager.FindByEmailAsync(input.Email) != null)
                   throw new UserFriendlyException("Email already exist");

               var newUser = new IdentityUser(id: Guid.NewGuid(), userName: input.Email, email: input.Email);
               var result = await _identityManager.CreateAsync(newUser, input.Password);
               if (!result.Succeeded) throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));

               // trong trang admin ko cần phải add role , tạo user ko role để admin tự thêm role
               if (input.Role != null)
               {
                   var role = await _roleManager.FindByNameAsync(input.Role);
                   if (role == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                   result = await _identityManager.AddToRoleAsync(newUser, role.Name);
                   if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));
               }

               await CurrentUnitOfWork.SaveChangesAsync();
           }*/

        public async Task ResetPasswordAsync(ResetPasswordDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            var result = await _identityManager.ResetPasswordAsync(user, input.Token, input.NewPassword);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.ResetPasswordFailed, string.Join(",", result.Errors.Select(x => x.Description)));
            //SAU CẦN GHI THÊM LOG VÀO ĐÂY
        }

    }
}