using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.Authentication;
using VCareer.Constants.ErrorCodes;
using VCareer.Constants.JobConstant;
using VCareer.Dto.AuthDto;
using VCareer.Dto.JwtDto;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Profile;
using VCareer.IServices.IAuth;
using VCareer.Jwt;
using VCareer.Models.Companies;
using VCareer.Models.Users;
using VCareer.OptionConfigs;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.Identity.AspNetCore;
using Volo.Abp.TextTemplating;
using Volo.Abp.Uow;
using Volo.Abp.Users;
using static Google.Apis.Requests.BatchRequest;
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
        private readonly IConfiguration _configuration;
        private readonly ICandidateProfileRepository _candidateProfileRepository;
        private readonly ICompanyRepository _companyRepository;
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IHttpContextAccessor _httpContextAcessor;

        public AuthAppService(
            IdentityUserManager identityManager,
            SignInManager<Volo.Abp.Identity.IdentityUser> signInManager,
            ITokenGenerator tokenGenerator,
            CurrentUser currentUser,
            IEmailSender emailSender,
            ITemplateRenderer templateRenderer,
            IdentityRoleManager roleManager,
            IOptions<GoogleOptions> googleOptions,
            IConfiguration configuration,
            ICandidateProfileRepository candidateProfile,
            ICompanyRepository companyRepository,
            IRecruiterRepository recruiterProfile,
            IEmployeeRepository employeeRepository,
            IHttpContextAccessor httpContextAcessor
           )
        {
            _identityManager = identityManager;
            _signInManager = signInManager;
            _tokenGenerator = tokenGenerator;
            _currentUser = currentUser;
            _emailSender = emailSender;
            _templateRenderer = templateRenderer;
            _roleManager = roleManager;
            _googleOptions = googleOptions.Value;
            _configuration = configuration;
            _candidateProfileRepository = candidateProfile;
            _companyRepository = companyRepository;
            _recruiterRepository = recruiterProfile;
            _employeeRepository = employeeRepository;
            _httpContextAcessor = httpContextAcessor;
        }



        public async Task ForgotPasswordAsync(ForgotPasswordDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new UserFriendlyException("Email not found");

            var token = await _identityManager.GeneratePasswordResetTokenAsync(user);

            // Lấy AngularUrl từ configuration với fallback
            var angularUrl = _configuration?["App:AngularUrl"]?.Trim() ?? "http://localhost:4200";

            // Đảm bảo URL không có trailing slash
            angularUrl = angularUrl.TrimEnd('/');

            // Log để debug (có thể xóa sau khi test xong)
            Logger.LogInformation($"ForgotPassword: AngularUrl from config = {angularUrl}");

            // Tạo link reset password với token và email trong query string
            // Sử dụng route chung /reset-password, component sẽ tự detect candidate/recruiter
            var resetLink = $"{angularUrl}/reset-password?email={Uri.EscapeDataString(input.Email)}&token={Uri.EscapeDataString(token)}";

            Logger.LogInformation($"ForgotPassword: Reset link = {resetLink}");

            var body = await _templateRenderer.RenderAsync(
                 "Abp.StandardEmailTemplates.Message",
            new { message = $"Nhấn vào liên kết để đặt lại mật khẩu: <a href='{resetLink}'>Reset Password</a>" }
                );

            await _emailSender.SendAsync(user.Email, "Forgot Password!", body);
        }

        public async Task RecruiterLoginAsync(LoginDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new UserFriendlyException("Email not found");

            // nếu đặt true ở hàm check pass thì nếu đăng nhập sai thì sẽ tạm thời kháo tài khoản 
            var check = await _signInManager.CheckPasswordSignInAsync(user, input.Password, false);
            if (!check.Succeeded) throw new UserFriendlyException("Invalid Password");

            var recruiterProfile = await _recruiterRepository.FirstOrDefaultAsync(x => x.UserId == user.Id);
            if (recruiterProfile == null) throw new UserFriendlyException("Login Failed");
            if (!recruiterProfile.Status) throw new UserFriendlyException("Tài khoản của bạn đã bị khóa");

            var tokens = await _tokenGenerator.CreateTokenAsync(user);
            UpdateTokenToCookie(tokens);
        }

        public async Task CandidateLoginAsync(LoginDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new UserFriendlyException("Email not found");

            // nếu đặt true ở hàm check pass thì nếu đăng nhập sai thì sẽ tạm thời kháo tài khoản 
            var check = await _signInManager.CheckPasswordSignInAsync(user, input.Password, false);
            if (!check.Succeeded) throw new UserFriendlyException("Invalid Password");

            var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == user.Id);
            if (candidateProfile == null) throw new UserFriendlyException("Login Failed");
            if (!candidateProfile.Status) throw new UserFriendlyException("Tài khoản của bạn đã bị khóa");

            var tokens = await _tokenGenerator.CreateTokenAsync(user);
            UpdateTokenToCookie(tokens);

        }

        [UnitOfWork]
        public async Task LoginWithGoogleAsync(GoogleLoginDto input)
        {
            try
            {
                Logger.LogInformation($"LoginWithGoogleAsync: Starting Google login with email from token");
                
                if (string.IsNullOrEmpty(input.IdToken))
                {
                    Logger.LogError("LoginWithGoogleAsync: IdToken is null or empty");
                    throw new UserFriendlyException("IdToken không được để trống");
                }

                if (string.IsNullOrEmpty(_googleOptions?.ClientId))
                {
                    Logger.LogError("LoginWithGoogleAsync: Google ClientId is not configured");
                    throw new UserFriendlyException("Google ClientId chưa được cấu hình");
                }

                Logger.LogInformation($"LoginWithGoogleAsync: Validating Google token with ClientId: {_googleOptions.ClientId}");
                
                GoogleJsonWebSignature.Payload payload;
                try
                {
                    payload = await GoogleJsonWebSignature.ValidateAsync(input.IdToken, new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { _googleOptions.ClientId }
                    });
                    Logger.LogInformation($"LoginWithGoogleAsync: Token validated successfully for email: {payload.Email}");
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, $"LoginWithGoogleAsync: Error validating Google token - {ex.Message}");
                    Logger.LogError($"LoginWithGoogleAsync: Exception type - {ex.GetType().Name}");
                    Logger.LogError($"LoginWithGoogleAsync: Stack trace - {ex.StackTrace}");
                    throw new UserFriendlyException($"Lỗi xác thực token Google: {ex.Message}. Vui lòng kiểm tra ClientId trong cấu hình.");
                }

                if (string.IsNullOrEmpty(payload.Email))
                {
                    Logger.LogError("LoginWithGoogleAsync: Email is null or empty in payload");
                    throw new UserFriendlyException("Không thể lấy email từ Google");
                }

                var user = await _identityManager.FindByEmailAsync(payload.Email);
                
                // Xác định role từ request (mặc định là candidate)
                var requestedRole = (input.Role ?? "").ToLower().Trim();
                var isRecruiterRequest = requestedRole == "recruiter";

            if (user == null)
            {
                // Tạo user mới
                Logger.LogInformation($"LoginWithGoogleAsync: Creating new user for email: {payload.Email}, requested role: {requestedRole}");
                user = new IdentityUser(id: Guid.NewGuid(), userName: payload.Email, email: payload.Email)
                {
                    IsExternal = true,
                    Name = payload.Name // Lưu tên từ Google
                };

                var result = await _identityManager.CreateAsync(user);
                if (!result.Succeeded) throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));

                if (isRecruiterRequest)
                {
                    // Tạo recruiter profile
                    Logger.LogInformation($"LoginWithGoogleAsync: Creating recruiter profile for new user");
                    
                    // Gán role LEADRECRUITER
                    var recruiterRole = await _roleManager.FindByNameAsync(RoleName.LEADRECRUITER);
                    if (recruiterRole == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                    result = await _identityManager.AddToRoleAsync(user, recruiterRole.Name);
                    if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));

                    // Tạo Company (cần có company để tạo recruiter profile)
                    var company = new Company
                    {
                        CompanyName = payload.Name ?? "Chưa cập nhật", // Tạm thời dùng tên từ Google
                        TaxCode = "" // Sẽ cập nhật sau
                    };
                    await _companyRepository.InsertAsync(company);
                    await CurrentUnitOfWork.SaveChangesAsync();

                    // Tạo RecruiterProfile
                    var recruiterProfile = new RecruiterProfile
                    {
                        UserId = user.Id,
                        Status = true,
                        Email = user.Email,
                        RecruiterLevel = RecruiterLevel.Unverified,
                        IsLead = true,
                        CompanyId = company.Id
                    };
                    await _recruiterRepository.InsertAsync(recruiterProfile);
                    await CurrentUnitOfWork.SaveChangesAsync();
                    Logger.LogInformation($"LoginWithGoogleAsync: Created new recruiter profile for user: {user.Email}");
                }
                else
                {
                    // Tạo candidate profile (mặc định)
                    Logger.LogInformation($"LoginWithGoogleAsync: Creating candidate profile for new user");
                    
                    // Gán role CANDIDATE
                    var role = await _roleManager.FindByNameAsync(RoleName.CANDIDATE);
                    if (role == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                    result = await _identityManager.AddToRoleAsync(user, role.Name);
                    if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));

                    // Tạo CandidateProfile
                    var candidateProfile = new CandidateProfile
                    {
                        UserId = user.Id,
                        Email = user.Email,
                        Status = true
                    };
                    await _candidateProfileRepository.InsertAsync(candidateProfile);
                    await CurrentUnitOfWork.SaveChangesAsync();
                    Logger.LogInformation($"LoginWithGoogleAsync: Created new candidate profile for user: {user.Email}");
                }
            }
            else
            {
                // User đã tồn tại - kiểm tra xem có recruiter profile hay candidate profile
                Logger.LogInformation($"LoginWithGoogleAsync: User already exists, checking profiles for: {user.Email}");
                
                var recruiterProfile = await _recruiterRepository.FirstOrDefaultAsync(r => r.UserId == user.Id);
                var candidateProfile = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == user.Id);
                
                if (recruiterProfile != null)
                {
                    // User có recruiter profile - xử lý như recruiter
                    Logger.LogInformation($"LoginWithGoogleAsync: User has recruiter profile, processing as recruiter");
                    
                    // Kiểm tra status
                    if (!recruiterProfile.Status) throw new UserFriendlyException("Tài khoản của bạn đã bị khóa");
                    
                    // Đảm bảo user có role recruiter
                    var roles = await _identityManager.GetRolesAsync(user);
                    var rolesLowerCase = roles.Select(r => r.ToLower()).ToList();
                    var hasRecruiterRole = rolesLowerCase.Any(r => r.Contains("recruiter") || r == "hr_staff");
                    
                    if (!hasRecruiterRole)
                    {
                        var recruiterRole = await _roleManager.FindByNameAsync(RoleName.LEADRECRUITER);
                        if (recruiterRole == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                        var result = await _identityManager.AddToRoleAsync(user, recruiterRole.Name);
                        if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));
                    }
                }
                else if (candidateProfile != null)
                {
                    // User có candidate profile - xử lý như candidate
                    Logger.LogInformation($"LoginWithGoogleAsync: User has candidate profile, processing as candidate");
                    
                    // Kiểm tra status
                    if (!candidateProfile.Status) throw new UserFriendlyException("Tài khoản của bạn đã bị khóa");
                    
                    // Đảm bảo user có role candidate
                    var roles = await _identityManager.GetRolesAsync(user);
                    if (!roles.Contains(RoleName.CANDIDATE))
                    {
                        var role = await _roleManager.FindByNameAsync(RoleName.CANDIDATE);
                        if (role == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                        var result = await _identityManager.AddToRoleAsync(user, role.Name);
                        if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));
                    }
                }
                else
                {
                    // User tồn tại nhưng chưa có profile nào - tạo candidate profile mặc định
                    Logger.LogInformation($"LoginWithGoogleAsync: User exists but no profile, creating candidate profile");
                    
                    // Kiểm tra và gán role CANDIDATE nếu chưa có
                    var roles = await _identityManager.GetRolesAsync(user);
                    if (!roles.Contains(RoleName.CANDIDATE))
                    {
                        var role = await _roleManager.FindByNameAsync(RoleName.CANDIDATE);
                        if (role == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                        var result = await _identityManager.AddToRoleAsync(user, role.Name);
                        if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));
                    }

                    candidateProfile = new CandidateProfile
                    {
                        UserId = user.Id,
                        Email = user.Email,
                        Status = true
                    };
                    await _candidateProfileRepository.InsertAsync(candidateProfile);
                    await CurrentUnitOfWork.SaveChangesAsync();
                }
            }

                Logger.LogInformation($"LoginWithGoogleAsync: Creating token for user: {user.Email}");
                var tokens = await _tokenGenerator.CreateTokenAsync(user);
                UpdateTokenToCookie(tokens);
                Logger.LogInformation($"LoginWithGoogleAsync: Google login successful for user: {user.Email}");
            }
            catch (UserFriendlyException)
            {
                // Re-throw UserFriendlyException để frontend hiển thị message
                throw;
            }
            catch (BusinessException)
            {
                // Re-throw BusinessException
                throw;
            }
            catch (EntityNotFoundException)
            {
                // Re-throw EntityNotFoundException
                throw;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"LoginWithGoogleAsync: Unexpected error - {ex.Message}");
                Logger.LogError($"LoginWithGoogleAsync: Stack trace - {ex.StackTrace}");
                throw new UserFriendlyException($"Lỗi đăng nhập Google: {ex.Message}");
            }
        }

        public async Task LogOutAllDeviceAsync()
        {
            if (!_currentUser.IsAuthenticated) return;

            // Sử dụng TokenClaimsHelper để lấy UserId an toàn
            var userId = _currentUser.GetId();
            if (userId == null || userId == Guid.Empty) throw new UserFriendlyException("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");

            var user = await _identityManager.FindByIdAsync(userId.ToString());
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
            if (userId == Guid.Empty) throw new UserFriendlyException("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");

            var user = await _identityManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            // Revoke tất cả refresh tokens của user (logout)
            await _tokenGenerator.CancleAsync(user);
            //delete cookie token 
            var response = _httpContextAcessor.HttpContext!.Response;
            response.Cookies.Delete("access_token");
            response.Cookies.Delete("refresh_token");
        }

        [UnitOfWork]
        public async Task CandidateRegisterAsync(CandidateRegisterDto input)
        {
            if (await _identityManager.FindByEmailAsync(input.Email) != null)
                throw new UserFriendlyException("Email already exist");

            var newUser = new IdentityUser(id: Guid.NewGuid(), userName: input.Email, email: input.Email);
            var result = await _identityManager.CreateAsync(newUser, input.Password);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));

            //gắn role canđiate
            var role = await _roleManager.FindByNameAsync(RoleName.CANDIDATE);
            if (role == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
            result = await _identityManager.AddToRoleAsync(newUser, role.Name);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));

            // cập nhật tạo bản ghi vào canđiate profile
            var candidateProfile = new CandidateProfile
            {
                UserId = newUser.Id,
                Email = newUser.Email,
                Status = true
            };
            await _candidateProfileRepository.InsertAsync(candidateProfile);

            await CurrentUnitOfWork.SaveChangesAsync();
        }

        [UnitOfWork]
        public async Task RecruiterRegisterAsync(RecruiterRegisterDto input)
        {
            if (await _identityManager.FindByEmailAsync(input.Email) != null)
                throw new UserFriendlyException("Email already exist");

            //check ma so thue

            var newUser = new IdentityUser(id: Guid.NewGuid(), userName: input.Email, email: input.Email);
            var result = await _identityManager.CreateAsync(newUser, input.Password);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));

            //gắn role recruiter 
            var role = await _roleManager.FindByNameAsync(RoleName.LEADRECRUITER);
            if (role == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
            result = await _identityManager.AddToRoleAsync(newUser, role.Name);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));

            //tạo công ty
            var company = new Company
            {
                CompanyName = input.CompanyName,
                TaxCode = input.TaxCode,
            };
            await _companyRepository.InsertAsync(company);
            await CurrentUnitOfWork.SaveChangesAsync();  // lay id som

            // cập nhật tạo bản ghi vào canđiate profile
            var recruiterProfile = new RecruiterProfile
            {
                UserId = newUser.Id,
                Status = true,
                Email = input.Email,
                RecruiterLevel = Constants.JobConstant.RecruiterLevel.Unverified,
                IsLead = true,
                CompanyId = company.Id,
            };
            await _recruiterRepository.InsertAsync(recruiterProfile, true);
        }

        public async Task ResetPasswordAsync(ResetPasswordDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new EntityNotFoundException(AuthErrorCode.UserNotFound);

            var result = await _identityManager.ResetPasswordAsync(user, input.Token, input.NewPassword);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.ResetPasswordFailed, string.Join(",", result.Errors.Select(x => x.Description)));
            //SAU CẦN GHI THÊM LOG VÀO ĐÂY
        }

        [UnitOfWork]
        public async Task CreateEmployeeAsync(CreateEmployeeDto input)
        {
            if (await _identityManager.FindByEmailAsync(input.Email) != null)
                throw new UserFriendlyException("Email already exist");

            //check ma so thue

            var newUser = new IdentityUser(id: Guid.NewGuid(), userName: input.Email, email: input.Email);
            var result = await _identityManager.CreateAsync(newUser, input.Password);
            if (!result.Succeeded) throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));

            foreach (var roleName in input.EmployeeRoles)
            {
                var roleCheck = await _roleManager.FindByNameAsync(roleName);
                if (roleCheck == null) throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
                result = await _identityManager.AddToRoleAsync(newUser, roleCheck.Name);
                if (!result.Succeeded) throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));
            }

            var employeeProfile = new EmployeeProfile
            {
                Email = input.Email,
                UserId = newUser.Id,
            };

            await _employeeRepository.InsertAsync(employeeProfile);
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        public async Task EmployeeLoginAsync(EmployeeLoginDto input)
        {
            var user = await _identityManager.FindByEmailAsync(input.Email);
            if (user == null) throw new UserFriendlyException("Email not found");

            // nếu đặt true ở hàm check pass thì nếu đăng nhập sai thì sẽ tạm thời kháo tài khoản 
            var check = await _signInManager.CheckPasswordSignInAsync(user, input.Password, false);
            if (!check.Succeeded) throw new UserFriendlyException("Invalid Password");

            var employeeProfile = await _employeeRepository.FirstOrDefaultAsync(x => x.UserId == user.Id);
            if (employeeProfile == null) throw new UserFriendlyException("Login Failed");
            if (!employeeProfile.Status) throw new UserFriendlyException("Tài khoản của bạn đã bị khóa");

            var tokens = await _tokenGenerator.CreateTokenAsync(user);
            UpdateTokenToCookie(tokens);
        }

        public async Task RefeshTokenAsync()
        {
            var request = _httpContextAcessor.HttpContext!.Request;
            var response = _httpContextAcessor.HttpContext.Response;

            var refreshToken = request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken)) throw new BusinessException("cant get refresk token to Refresh");

            var tokens = await _tokenGenerator.RefreshAsync(refreshToken);
            if (tokens == null) throw new BusinessException("Refresh token create failed");
            UpdateTokenToCookie(tokens);
        }

        private void UpdateTokenToCookie(TokenResponseDto tokenResonse)
        {
            var response = _httpContextAcessor.HttpContext?.Response ?? throw new BusinessException("Cannot access HTTP response");
            // dù append ghi đè cookie nhưng có trường hợp ko xóa được thì lỗi
            // ví dụ như cùng name nhưung khác path là ko apppend được rồi 
            //response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
            //response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });

            double expiredMinuteAcesstoken = 5;
            if (tokenResonse.ExpireMinuteAcesstoken!=null) expiredMinuteAcesstoken = double.Parse(tokenResonse.ExpireHourRefreshToken);

            double expiredHourReFrecesstoken = 48;
            if (tokenResonse.ExpireHourRefreshToken!=null) expiredHourReFrecesstoken= double.Parse(tokenResonse.ExpireHourRefreshToken);

            response.Cookies.Append("access_token", tokenResonse.AccessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(expiredMinuteAcesstoken),
                Path = "/"
            });

            response.Cookies.Append("refresh_token", tokenResonse.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddHours(expiredHourReFrecesstoken),
                Path = "/"
            });
        }
        //vì fe ko thể đọc được cookie để decode claims nên phải tạo 1 api để gửi thông tin người dùng hiện tại từ current user
        //còn mục đích của token là để phục vụ auth backend , tạo current user
        //thực ra có khi vẫn dùng curent user bình thường , cái này ko b có tác dụng j ko 
        public async Task<CurrentUserInfoDto> GetCurrentUserAsync()
        {
            var email = _currentUser.Email;
            var fullName = _currentUser.Name;
            var roles = _currentUser.Roles;
            var userId = _currentUser.Id;

            /*    if (string.IsNullOrEmpty(email) ||
                   !roles.Any() ||
                   userId == null) throw new BusinessException("Cant get current user infomation");*/

            return await Task.FromResult(new CurrentUserInfoDto
            {
                Email = email,
                FullName = fullName,
                Roles = roles,
                UserId = userId
            });
        }
    }
}