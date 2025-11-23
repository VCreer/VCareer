using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Constants.Authentication;
using VCareer.Constants.ErrorCodes;
using VCareer.Dto.TeamManagementDto;
using VCareer.IServices.ITeamManagement;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.TextTemplating;
using Volo.Abp.Uow;
using Volo.Abp.Users;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace VCareer.Services.TeamManagement
{
    /// <summary>
    /// Implementation của Team Management Service
    /// </summary>
    public class TeamManagementAppService : ApplicationService, ITeamManagementAppService
    {
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly IRepository<EmployeeProfile, Guid> _employeeProfileRepository;
        private readonly IdentityUserManager _userManager;
        private readonly IdentityRoleManager _roleManager;
        private readonly ICurrentUser _currentUser;
        private readonly IEmailSender _emailSender;
        private readonly ITemplateRenderer _templateRenderer;

        public TeamManagementAppService(
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            IRepository<EmployeeProfile, Guid> employeeProfileRepository,
            IdentityUserManager userManager,
            IdentityRoleManager roleManager,
            ICurrentUser currentUser,
            IEmailSender emailSender,
            ITemplateRenderer templateRenderer)
        {
            _recruiterProfileRepository = recruiterProfileRepository;
            _employeeProfileRepository = employeeProfileRepository;
            _userManager = userManager;
            _roleManager = roleManager;
            _currentUser = currentUser;
            _emailSender = emailSender;
            _templateRenderer = templateRenderer;
        }

        /// <summary>
        /// Lấy thông tin user hiện tại (DEBUG)
        /// </summary>
        public async Task<StaffListItemDto> GetCurrentUserInfoAsync()
        {
            try
            {
                var currentRecruiter = await GetCurrentRecruiterProfileAsync();
                
                return new StaffListItemDto
                {
                    UserId = currentRecruiter.UserId,
                    RecruiterProfileId = currentRecruiter.Id,
                    FullName = $"{currentRecruiter.User?.Name} {currentRecruiter.User?.Surname}".Trim(),
                    Email = currentRecruiter.User?.Email ?? "",
                    IsLead = currentRecruiter.IsLead,
                    Status = currentRecruiter.Status,
                    CompanyId = currentRecruiter.CompanyId,
                    CompanyName = currentRecruiter.Company?.CompanyName ?? ""
                };
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Lỗi: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách HR Staff (IsLead = 0) trong company
        /// Chỉ Leader Recruiter (IsLead = 1) mới có quyền xem
        /// </summary>
        public async Task<List<StaffListItemDto>> GetAllStaffAsync()
        {
            // Get current user profile và verify là Leader Recruiter (IsLead = 1)
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            
            // Verify current user là Leader (IsLead = 1)
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter (IsLead = 1) mới có quyền quản lý HR Staff.");
            }

            // Get only HR Staff (IsLead = 0) trong cùng company
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User, r => r.Company);
            var staffList = queryable
                .Where(r => r.CompanyId == currentRecruiter.CompanyId && !r.IsLead) // Chỉ lấy HR Staff (IsLead = false)
                .ToList();

            // Map to DTO
            var result = staffList.Select(s => new StaffListItemDto
            {
                UserId = s.UserId,
                RecruiterProfileId = s.Id,
                FullName = $"{s.User?.Name} {s.User?.Surname}".Trim(),
                Email = s.User?.Email ?? "",
                IsLead = s.IsLead,
                Status = s.Status,
                CompanyId = s.CompanyId,
                CompanyName = s.Company?.CompanyName ?? ""
            }).ToList();

            return result;
        }

        /// <summary>
        /// Deactivate HR Staff
        /// </summary>
        public async Task<StaffStatusChangeDto> DeactivateStaffAsync(DeactivateStaffDto input)
        {
            // Validate input
            if (input.StaffId == Guid.Empty)
            {
                throw new UserFriendlyException("Staff ID không hợp lệ.");
            }

            // Get current user profile và verify là Leader Recruiter (IsLead = 1)
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            
            // Verify current user là Leader (IsLead = 1)
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter (IsLead = 1) mới có quyền deactivate staff.");
            }

            // Get staff profile - tìm theo RecruiterProfileId (StaffId là RecruiterProfileId)
            // Sử dụng WithDetailsAsync để load đầy đủ entity với User và ConcurrencyStamp
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User);
            var staffRecruiter = queryable.FirstOrDefault(r => r.Id == input.StaffId);

            if (staffRecruiter == null)
            {
                throw new UserFriendlyException("Không tìm thấy staff.");
            }

            // Verify cùng company
            if (staffRecruiter.CompanyId != currentRecruiter.CompanyId)
            {
                throw new UserFriendlyException("Bạn chỉ có thể deactivate staff trong cùng công ty.");
            }

            // Không thể deactivate Leader Recruiter khác (IsLead = 1)
            if (staffRecruiter.IsLead && staffRecruiter.UserId != currentRecruiter.UserId)
            {
                throw new UserFriendlyException("Không thể deactivate Leader Recruiter khác.");
            }

            // Không thể deactivate chính mình
            if (staffRecruiter.UserId == currentRecruiter.UserId)
            {
                throw new UserFriendlyException("Không thể deactivate chính mình.");
            }

            // Check nếu đã inactive rồi
            if (!staffRecruiter.Status)
            {
                throw new UserFriendlyException("Staff này đã được deactivate trước đó.");
            }

            // Store previous status và User reference
            var previousStatus = staffRecruiter.Status;
            var userRef = staffRecruiter.User;

            // Reload entity để đảm bảo có ConcurrencyStamp mới nhất trước khi update
            // Điều này giúp tránh lỗi concurrency khi có nhiều user cùng thao tác
            try
            {
                var reloadedStaff = await _recruiterProfileRepository.GetAsync(input.StaffId, includeDetails: false);
                reloadedStaff.Status = false;
                reloadedStaff.User = userRef; // Giữ lại User reference
                await _recruiterProfileRepository.UpdateAsync(reloadedStaff);
                staffRecruiter = reloadedStaff;
            }
            catch (Exception)
            {
                // Nếu GetAsync fail (entity không tồn tại), sử dụng entity đã load
                staffRecruiter.Status = false;
                await _recruiterProfileRepository.UpdateAsync(staffRecruiter);
            }

            // Build response
            var currentUserName = $"{currentRecruiter.User?.Name} {currentRecruiter.User?.Surname}";
            var staffFullName = $"{staffRecruiter.User?.Name ?? userRef?.Name} {staffRecruiter.User?.Surname ?? userRef?.Surname}";

            return new StaffStatusChangeDto
            {
                StaffId = staffRecruiter.UserId,
                FullName = staffFullName,
                Email = staffRecruiter.User?.Email,
                PreviousStatus = previousStatus,
                NewStatus = staffRecruiter.Status,
                Action = "Deactivate",
                Reason = input.Reason,
                ChangeTimestamp = DateTime.Now,
                PerformedBy = currentUserName,
                Message = $"Staff {staffFullName} đã được deactivate thành công."
            };
        }

        /// <summary>
        /// Invite HR Staff mới
        /// Tạo tài khoản và gửi email với thông tin đăng nhập
        /// </summary>
        [UnitOfWork]
        public async Task<StaffListItemDto> InviteStaffAsync(InviteStaffDto input)
        {
            // Get current user profile và verify là Leader Recruiter (IsLead = 1)
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            
            // Verify current user là Leader (IsLead = 1)
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter (IsLead = 1) mới có quyền invite HR Staff.");
            }

            // Check email đã tồn tại chưa
            var existingUser = await _userManager.FindByEmailAsync(input.Email);
            if (existingUser != null)
            {
                throw new UserFriendlyException("Email đã tồn tại trong hệ thống.");
            }

            // Generate random password 6 characters
            var randomPassword = GenerateRandomPassword(6);

            // Tạo IdentityUser
            var newUser = new IdentityUser(id: Guid.NewGuid(), userName: input.Email, email: input.Email);
            var result = await _userManager.CreateAsync(newUser, randomPassword);
            if (!result.Succeeded)
            {
                throw new BusinessException(AuthErrorCode.RegisterFailed, string.Join(",", result.Errors.Select(x => x.Description)));
            }

            // Gán role hr_staff
            var role = await _roleManager.FindByNameAsync(RoleName.HRSTAFF);
            if (role == null)
            {
                throw new EntityNotFoundException(AuthErrorCode.RoleNotFound);
            }
            result = await _userManager.AddToRoleAsync(newUser, role.Name);
            if (!result.Succeeded)
            {
                throw new BusinessException(AuthErrorCode.AddRoleFail, string.Join(",", result.Errors.Select(x => x.Description)));
            }

            // Tạo RecruiterProfile với IsLead = false và CompanyId của Leader
            var recruiterProfile = new RecruiterProfile
            {
                UserId = newUser.Id,
                Status = true,
                Email = input.Email,
                RecruiterLevel = Constants.JobConstant.RecruiterLevel.Unverified,
                IsLead = false, // HR Staff không phải Leader
                CompanyId = currentRecruiter.CompanyId, // Cùng công ty với Leader
            };
            await _recruiterProfileRepository.InsertAsync(recruiterProfile);
            await CurrentUnitOfWork.SaveChangesAsync();

            // Gửi email với thông tin đăng nhập
            var emailBody = await _templateRenderer.RenderAsync(
                "Abp.StandardEmailTemplates.Message",
                new
                {
                    message = $@"
                        <h2>Chào mừng bạn đến với VCareer!</h2>
                        <p>Bạn đã được mời tham gia với vai trò HR Staff tại công ty {currentRecruiter.Company?.CompanyName ?? ""}.</p>
                        <p><strong>Thông tin đăng nhập:</strong></p>
                        <ul>
                            <li><strong>Email:</strong> {input.Email}</li>
                            <li><strong>Mật khẩu:</strong> {randomPassword}</li>
                        </ul>
                        <p>Vui lòng đăng nhập và đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
                        <p>Trân trọng,<br/>Đội ngũ VCareer</p>
                    "
                }
            );

            await _emailSender.SendAsync(input.Email, "Thông tin đăng nhập VCareer - HR Staff", emailBody);

            // Return created staff info
            return new StaffListItemDto
            {
                UserId = newUser.Id,
                RecruiterProfileId = recruiterProfile.Id,
                FullName = $"{newUser.Name} {newUser.Surname}".Trim(),
                Email = newUser.Email,
                IsLead = false,
                Status = true,
                CompanyId = currentRecruiter.CompanyId,
                CompanyName = currentRecruiter.Company?.CompanyName ?? ""
            };
        }

        /// <summary>
        /// Generate random password với đủ yêu cầu: uppercase, lowercase, digit, special char
        /// </summary>
        private string GenerateRandomPassword(int length = 6)
        {
            const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lowercase = "abcdefghijklmnopqrstuvwxyz";
            const string digits = "0123456789";
            const string specialChars = "!@#$%^&*()";
            const string allChars = uppercase + lowercase + digits + specialChars;

            var random = new Random();
            var password = new char[length];

            // Đảm bảo có ít nhất 1 uppercase, 1 lowercase, 1 digit, 1 special char
            password[0] = uppercase[random.Next(uppercase.Length)];
            password[1] = lowercase[random.Next(lowercase.Length)];
            password[2] = digits[random.Next(digits.Length)];
            password[3] = specialChars[random.Next(specialChars.Length)];

            // Điền các ký tự còn lại
            for (int i = 4; i < length; i++)
            {
                password[i] = allChars[random.Next(allChars.Length)];
            }

            // Shuffle để tránh pattern dễ đoán
            for (int i = length - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (password[i], password[j]) = (password[j], password[i]);
            }

            return new string(password);
        }

        /// <summary>
        /// Activate HR Staff
        /// </summary>
        public async Task<StaffStatusChangeDto> ActivateStaffAsync(ActivateStaffDto input)
        {
            // Validate input
            if (input.StaffId == Guid.Empty)
            {
                throw new UserFriendlyException("Staff ID không hợp lệ.");
            }

            // Get current user profile và verify là Leader Recruiter (IsLead = 1)
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            
            // Verify current user là Leader (IsLead = 1)
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter (IsLead = 1) mới có quyền activate staff.");
            }

            // Get staff profile - tìm theo RecruiterProfileId (StaffId là RecruiterProfileId)
            // Sử dụng WithDetailsAsync để load đầy đủ entity với User và ConcurrencyStamp
            var queryable2 = await _recruiterProfileRepository.WithDetailsAsync(r => r.User);
            var staffRecruiter = queryable2.FirstOrDefault(r => r.Id == input.StaffId);

            if (staffRecruiter == null)
            {
                throw new UserFriendlyException("Không tìm thấy staff.");
            }

            // Verify cùng company
            if (staffRecruiter.CompanyId != currentRecruiter.CompanyId)
            {
                throw new UserFriendlyException("Bạn chỉ có thể activate staff trong cùng công ty.");
            }

            // Check nếu đã active rồi
            if (staffRecruiter.Status)
            {
                throw new UserFriendlyException("Staff này đã ở trạng thái active.");
            }

            // Store previous status và User reference
            var previousStatus = staffRecruiter.Status;
            var userRef = staffRecruiter.User;

            // Reload entity để đảm bảo có ConcurrencyStamp mới nhất trước khi update
            // Điều này giúp tránh lỗi concurrency khi có nhiều user cùng thao tác
            try
            {
                var reloadedStaff = await _recruiterProfileRepository.GetAsync(input.StaffId, includeDetails: false);
                reloadedStaff.Status = true;
                reloadedStaff.User = userRef; // Giữ lại User reference
                await _recruiterProfileRepository.UpdateAsync(reloadedStaff);
                staffRecruiter = reloadedStaff;
            }
            catch (Exception)
            {
                // Nếu GetAsync fail (entity không tồn tại), sử dụng entity đã load
                staffRecruiter.Status = true;
                await _recruiterProfileRepository.UpdateAsync(staffRecruiter);
            }

            // Build response
            var currentUserName = $"{currentRecruiter.User?.Name} {currentRecruiter.User?.Surname}";
            var staffFullName = $"{staffRecruiter.User?.Name ?? userRef?.Name} {staffRecruiter.User?.Surname ?? userRef?.Surname}";

            return new StaffStatusChangeDto
            {
                StaffId = staffRecruiter.UserId,
                FullName = staffFullName,
                Email = staffRecruiter.User?.Email,
                PreviousStatus = previousStatus,
                NewStatus = staffRecruiter.Status,
                Action = "Activate",
                Reason = input.Reason,
                ChangeTimestamp = DateTime.Now,
                PerformedBy = currentUserName,
                Message = $"Staff {staffFullName} đã được activate thành công."
            };
        }

        #region Private Helper Methods

        /// <summary>
        /// Lấy RecruiterProfile của user hiện tại
        /// </summary>
        private async Task<RecruiterProfile> GetCurrentRecruiterProfileAsync()
        {
            if (!_currentUser.IsAuthenticated)
            {
                throw new UserFriendlyException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            var currentUserId = _currentUser.Id.Value;
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User, r => r.Company);
            var recruiter = queryable.FirstOrDefault(r => r.UserId == currentUserId);

            if (recruiter == null)
            {
                throw new UserFriendlyException("Bạn không phải là Recruiter.");
            }

            return recruiter;
        }

        /// <summary>
        /// Kiểm tra user có role "Leader Recruiter" không
        /// </summary>
        private async Task<bool> IsLeaderRecruiterAsync(IdentityUser user)
        {
            if (user == null)
            {
                return false;
            }

            var roles = await _userManager.GetRolesAsync(user);
            return roles.Contains("Leader Recruiter", StringComparer.OrdinalIgnoreCase);
        }

        #endregion
    }
}
