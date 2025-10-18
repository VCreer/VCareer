using Abp.Domain.Uow;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.ErrorCodes;
using VCareer.Dto.AuthDto;
using VCareer.Dto.JwtDto;
using VCareer.IServices.IAuth;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.Identity.AspNetCore;
using Volo.Abp.TextTemplating;
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
        private readonly CurrentUser _currentUser;
        private readonly IEmailSender _emailSender;
        private readonly ITemplateRenderer _templateRenderer;

        public AuthAppService(IdentityUserManager identityManager, SignInManager<Volo.Abp.Identity.IdentityUser> signInManager, ITokenGenerator tokenGenerator, CurrentUser currentUser, IEmailSender emailSender, ITemplateRenderer templateRenderer)
        {
            _identityManager = identityManager;
            _signInManager = signInManager;
            _tokenGenerator = tokenGenerator;
            _currentUser = currentUser;
            _emailSender = emailSender;
            _templateRenderer = templateRenderer;
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
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            var check = await _signInManager.CheckPasswordSignInAsync(user, input.Password, true);
            if (!check.Succeeded) throw new UserFriendlyException("Invalid Password");

            return await _tokenGenerator.CreateTokenAsync(user);
        }

        public async Task<TokenResponseDto> LoginWithGoogleAsync(GoogleLoginDto input)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(input.IdToken);
            var user = await _identityManager.FindByEmailAsync(payload.Email);

            if (user == null)
            {
                user = new IdentityUser(id: Guid.NewGuid(), userName: payload.Email, email: payload.Email);
            }

            return await _tokenGenerator.CreateTokenAsync(user);
        }

        public async Task LogOutAsync()
        {
            var userId = _currentUser.GetId();
            var user = await _identityManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            await _tokenGenerator.CancleAsync(user);
        }

        public async Task RegisterAsync(RegisterDto input)
        {
            var user = _identityManager.FindByEmailAsync(input.Email);
            if (user != null) throw new UserFriendlyException("Email already exist");

            var newUser = new IdentityUser(id: Guid.NewGuid(), userName: input.Email, email: input.Email);
            await _identityManager.CreateAsync(newUser, input.Password);
        }

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
