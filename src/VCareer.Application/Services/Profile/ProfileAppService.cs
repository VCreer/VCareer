using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using VCareer.Dto.Profile;
using VCareer.IServices.IProfileServices;
using VCareer.Model;
using VCareer.Models.Users;
using VCareer.Permission;
using VCareer.Permissions;
using VCareer.Services.LuceneService.CandidateSearch;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Data;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Emailing;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Volo.Abp.Validation;
using Volo.Abp.Domain.Entities;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Volo.Abp.Uow;

namespace VCareer.Services.Profile
{
    /*[Authorize(VCareerPermission.Profile.Default)]*/
    public class ProfileAppService : VCareerAppService, IProfileAppService
    {
        private readonly IdentityUserManager _userManager;
        private readonly ICurrentUser _currentUser;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly IRepository<EmployeeProfile, Guid> _employeeProfileRepository;
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly IEmailSender _emailSender;
        private readonly CandidateIndexService _candidateIndexService;
        private readonly IRepository<Volo.Abp.Identity.IdentityUser, Guid> _identityUserRepository;
        private readonly IUnitOfWorkManager _unitOfWorkManager;
        private static readonly Dictionary<string, EmailOtpData> _emailOtpStore = new Dictionary<string, EmailOtpData>();

        private class EmailOtpData
        {
            public string Otp { get; set; }
            public DateTime ExpiryTime { get; set; }
            public string Email { get; set; }
        }

        public ProfileAppService(
            IdentityUserManager userManager,
            ICurrentUser currentUser,
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            IRepository<EmployeeProfile, Guid> employeeProfileRepository,
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            IEmailSender emailSender,
            CandidateIndexService candidateIndexService,
            IRepository<Volo.Abp.Identity.IdentityUser, Guid> identityUserRepository,
            IUnitOfWorkManager unitOfWorkManager)
        {
            _userManager = userManager;
            _currentUser = currentUser;
            _candidateProfileRepository = candidateProfileRepository;
            _employeeProfileRepository = employeeProfileRepository;
            _recruiterProfileRepository = recruiterProfileRepository;
            _emailSender = emailSender;
            _candidateIndexService = candidateIndexService;
            _identityUserRepository = identityUserRepository;
            _unitOfWorkManager = unitOfWorkManager;
        }

        //ádadad

        /*[Authorize(VCareerPermission.Profile.UpdatePersonalInfo)]*/
        public async Task UpdatePersonalInfoAsync(UpdatePersonalInfoDto input)
        {
            // Lấy UserId từ token claims thay vì ICurrentUser
            var userId = _currentUser.GetId();
                var user = await _userManager.GetByIdAsync(userId);


            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // 1. Update basic user information in IdentityUser
            // Nếu surname không nhập, fallback = name để tránh lỗi validation
            var safeSurname = string.IsNullOrWhiteSpace(input.Surname) ? input.Name : input.Surname;
            user.Name = input.Name;
            user.Surname = safeSurname;

            // nếu inpuit email khác email hiện tại của user
            if (!string.IsNullOrEmpty(input.Email) && user.Email != input.Email)
            {
                var emailResult = await _userManager.SetEmailAsync(user, input.Email);
                if (!emailResult.Succeeded)
                {
                    throw new UserFriendlyException($"Failed to update email: {string.Join(", ", emailResult.Errors)}");
                }
            }

            // Update PhoneNumber using IdentityUserManager method
            if (!string.IsNullOrEmpty(input.PhoneNumber) && user.PhoneNumber != input.PhoneNumber)
            {
                // Kiểm tra trùng số điện thoại với user khác qua repository (store không hỗ trợ IQueryable)
                var userQueryable = await _identityUserRepository.GetQueryableAsync();
                var existingUserWithPhone = await userQueryable
                    .Where(u => u.PhoneNumber == input.PhoneNumber && u.Id != user.Id)
                    .FirstOrDefaultAsync();

                if (existingUserWithPhone != null)
                {
                    throw new AbpValidationException("Số điện thoại này đã được sử dụng cho một tài khoản khác.");
                }

                var phoneResult = await _userManager.SetPhoneNumberAsync(user, input.PhoneNumber);
                if (!phoneResult.Succeeded)
                {
                    throw new UserFriendlyException($"Failed to update phone number: {string.Join(", ", phoneResult.Errors)}");
                }
            }

            // Persist gender in user extra properties for roles without dedicated profile fields
            // 2. Update detailed profile information in appropriate profile table
            await UpdateUserProfileAsync(user.Id, input);

            // 3. Save IdentityUser changes
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                throw new UserFriendlyException($"Failed to update profile: {string.Join(", ", result.Errors)}");
            }
        }


        //ádada
        /*[Authorize(VCareerPermission.Profile.ChangePassword)]*/
        public async Task ChangePasswordAsync(ChangePasswordDto input)
        {
            // Lấy UserId từ token claims thay vì ICurrentUser
            var userId = _currentUser.GetId();
            var user = await _userManager.GetByIdAsync(userId);

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // Verify current password
            var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, input.CurrentPassword);
            if (!isCurrentPasswordValid)
            {
                throw new UserFriendlyException("Current password is incorrect.");
            }

            // Change password
            var result = await _userManager.ChangePasswordAsync(user, input.CurrentPassword, input.NewPassword);

            if (!result.Succeeded)
            {
                throw new UserFriendlyException($"Failed to change password: {string.Join(", ", result.Errors)}");
            }
        }

        public async Task VerifyPhoneNumberAsync(VerifyPhoneNumberDto input)
        {
            if (input == null)
            {
                throw new UserFriendlyException("Thông tin xác thực không hợp lệ.");
            }

            var userId = _currentUser.GetId();
            var user = await _userManager.GetByIdAsync(userId);

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // TODO: Validate OTP via external provider/service
            if (!string.IsNullOrWhiteSpace(input.PhoneNumber) && user.PhoneNumber != input.PhoneNumber)
            {
                var phoneResult = await _userManager.SetPhoneNumberAsync(user, input.PhoneNumber);
                if (!phoneResult.Succeeded)
                {
                    throw new UserFriendlyException($"Failed to update phone number: {string.Join(", ", phoneResult.Errors)}");
                }
            }

            var token = await _userManager.GenerateChangePhoneNumberTokenAsync(user, user.PhoneNumber);
            var result = await _userManager.ChangePhoneNumberAsync(user, user.PhoneNumber, token);
            if (!result.Succeeded)
            {
                throw new UserFriendlyException($"Failed to verify phone number: {string.Join(", ", result.Errors)}");
            }
        }

        public async Task SendEmailOtpAsync(SendEmailOtpDto input)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.Email))
            {
                throw new UserFriendlyException("Email không hợp lệ.");
            }

            var userId = _currentUser.GetId();
            var user = await _userManager.GetByIdAsync(userId);

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // Generate 6-digit OTP
            var otp = GenerateOtp();
            var expiryTime = DateTime.UtcNow.AddMinutes(10); // OTP expires in 10 minutes

            // Store OTP in memory (in production, use Redis or database)
            var key = $"{userId}_{input.Email}";
            _emailOtpStore[key] = new EmailOtpData
            {
                Otp = otp,
                ExpiryTime = expiryTime,
                Email = input.Email
            };

            // Send OTP email
            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #0F83BA;'>Xác thực Email</h2>
                    <p>Xin chào,</p>
                    <p>Mã OTP để xác thực email của bạn là:</p>
                    <div style='background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;'>
                        <h1 style='color: #0F83BA; font-size: 32px; margin: 0; letter-spacing: 5px;'>{otp}</h1>
                    </div>
                    <p>Mã này sẽ hết hạn sau 10 phút.</p>
                    <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br/>Đội ngũ VCareer</p>
                </div>";

            await _emailSender.SendAsync(input.Email, "Mã OTP xác thực email - VCareer", emailBody);
        }

        public async Task VerifyEmailNumberAsync(VerifyEmailNumberDto input)
        {
            if (input == null)
            {
                throw new UserFriendlyException("Thông tin xác thực không hợp lệ.");
            }

            if (string.IsNullOrWhiteSpace(input.OtpCode))
            {
                throw new UserFriendlyException("Vui lòng nhập mã OTP.");
            }

            var userId = _currentUser.GetId();
            var user = await _userManager.GetByIdAsync(userId);

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // Verify OTP
            var key = $"{userId}_{input.Email}";
            if (!_emailOtpStore.ContainsKey(key))
            {
                throw new UserFriendlyException("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã OTP.");
            }

            var otpData = _emailOtpStore[key];
            if (DateTime.UtcNow > otpData.ExpiryTime)
            {
                _emailOtpStore.Remove(key);
                throw new UserFriendlyException("Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP.");
            }

            if (otpData.Otp != input.OtpCode)
            {
                throw new UserFriendlyException("Mã OTP không đúng. Vui lòng kiểm tra lại.");
            }

            // OTP is valid, verify email
            // Kiểm tra trạng thái hiện tại trước khi update để tránh concurrency exception không cần thiết
            user = await _userManager.GetByIdAsync(userId);
            if (user == null)
            {
                throw new UserFriendlyException("Không tìm thấy người dùng.");
            }

            // Nếu email đã được confirm rồi và email đã đúng, không cần update nữa
            bool emailMatches = string.IsNullOrWhiteSpace(input.Email) || 
                                string.Equals(user.Email, input.Email, StringComparison.OrdinalIgnoreCase);
            
            if (user.EmailConfirmed && emailMatches)
            {
                // Email đã được verify rồi, chỉ cần remove OTP
                _emailOtpStore.Remove(key);
                return;
            }

            // Cần update - sử dụng retry logic để xử lý concurrency exception
            const int maxRetries = 3;
            int retryCount = 0;
            bool updateSuccess = false;

            while (retryCount < maxRetries && !updateSuccess)
            {
                try
                {
                    // Reload user để lấy ConcurrencyStamp mới nhất (nếu đã retry)
                    if (retryCount > 0)
                    {
                        user = await _userManager.GetByIdAsync(userId);
                        if (user == null)
                        {
                            throw new UserFriendlyException("Không tìm thấy người dùng.");
                        }
                        
                        // Kiểm tra lại xem đã được confirm chưa
                        if (user.EmailConfirmed && 
                            (string.IsNullOrWhiteSpace(input.Email) || 
                             string.Equals(user.Email, input.Email, StringComparison.OrdinalIgnoreCase)))
                        {
                            // Đã được confirm rồi, không cần update nữa
                            updateSuccess = true;
                            break;
                        }
                    }

                    // Apply changes chỉ khi cần thiết
                    if (!string.IsNullOrWhiteSpace(input.Email) && !string.Equals(user.Email, input.Email, StringComparison.OrdinalIgnoreCase))
                    {
                        var normalizedEmail = _userManager.NormalizeEmail(input.Email);
                        user.SetProperty("Email", input.Email);
                        user.SetProperty("NormalizedEmail", normalizedEmail);
                    }

                    if (!user.EmailConfirmed)
                    {
                        SetEmailConfirmedValue(user, true);
                    }

                    // Update user using repository with autoSave = false để có thể catch exception
                    await _identityUserRepository.UpdateAsync(user, autoSave: false);
                    
                    // Save changes ngay để exception được throw trong method này
                    await _unitOfWorkManager.Current.SaveChangesAsync();
                    
                    updateSuccess = true;
                }
                catch (AbpDbConcurrencyException ex)
                {
                    retryCount++;
                    if (retryCount >= maxRetries)
                    {
                        // Sau khi retry nhiều lần vẫn lỗi, kiểm tra lại trạng thái cuối cùng
                        user = await _userManager.GetByIdAsync(userId);
                        if (user != null && user.EmailConfirmed)
                        {
                            // Email đã được confirm rồi, coi như thành công
                            updateSuccess = true;
                            break;
                        }
                        // Nếu vẫn lỗi, không throw exception mà chỉ log và coi như thành công
                        // Vì có thể email đã được verify bởi request khác
                        Logger.LogWarning($"Concurrency exception khi verify email cho user {userId} sau {maxRetries} lần retry. Kiểm tra trạng thái cuối cùng.");
                        updateSuccess = true; // Coi như thành công để không làm gián đoạn user
                        break;
                    }
                    // Tiếp tục retry
                    await Task.Delay(100 * retryCount); // Delay tăng dần: 100ms, 200ms, 300ms
                }
            }

            // Remove OTP from store after successful verification
            if (updateSuccess)
            {
                _emailOtpStore.Remove(key);
            }
        }

        private void SetEmailConfirmedValue(Volo.Abp.Identity.IdentityUser user, bool value)
        {
            var prop = typeof(Volo.Abp.Identity.IdentityUser).GetProperty("EmailConfirmed", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);
            prop?.SetValue(user, value);
        }

        private string GenerateOtp()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }


        // lấy thông tin id hiện tại
        public async Task<ProfileDto> GetCurrentUserProfileAsync()
        {
            // Lấy UserId từ token claims thay vì ICurrentUser
            var userId = _currentUser.GetId();
            var user = await _userManager.GetByIdAsync(userId);

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // Get profile info từ Candidate/Employee/Recruiter table
            var (userType, bio, dateOfBirth, gender, location, jobTitle, skills, experience, salary, workLocation, profileVisibility) = await GetUserProfileInfoAsync(user.Id);

            // Get CompanyId from RecruiterProfile if user is Recruiter
            int? companyId = null;
            if (userType == "Recruiter")
            {
                var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == user.Id);
                if (recruiter != null)
                {
                    companyId = recruiter.CompanyId;
                }
            }

            return new ProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Bio = bio,
                DateOfBirth = dateOfBirth,
                Gender = gender,
                Location = location,
                Address = "", // Không có trong 3 bảng profile
                Nationality = "", // Không có trong 3 bảng profile
                MaritalStatus = "", // Không có trong 3 bảng profile
                UserName = user.UserName,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                CreationTime = user.CreationTime,
                LastModificationTime = user.LastModificationTime,
                UserType = userType,
                CompanyId = companyId,
                JobTitle = jobTitle ?? "",
                Skills = skills ?? "",
                Experience = experience,
                Salary = salary,
                WorkLocation = workLocation ?? "",
                ProfileVisibility = profileVisibility
            };
        }



        /*[Authorize(VCareerPermission.Profile.DeleteAccount)]*/
        public async Task DeleteAccountAsync()
        {
            // Lấy UserId từ token claims thay vì ICurrentUser
            var userId = _currentUser.GetId();
            var user = await _userManager.GetByIdAsync(userId);

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // 1. Soft delete IdentityUser
            await _userManager.DeleteAsync(user);

            // 2. Soft delete CandidateProfile (nếu có)
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate != null)
            {
                await _candidateProfileRepository.DeleteAsync(candidate);
                
                // Xóa khỏi Lucene index
                try
                {
                    await _candidateIndexService.RemoveCandidateFromIndexAsync(userId);
                }
                catch (Exception ex)
                {
                    Logger.LogWarning(ex, "Lỗi khi xóa candidate {UserId} khỏi Lucene index", userId);
                }
            }

            // 3. Soft delete EmployeeProfile (nếu có)
            var employee = await _employeeProfileRepository.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee != null)
            {
                await _employeeProfileRepository.DeleteAsync(employee);
            }

            // 4. Soft delete RecruiterProfile (nếu có)
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter != null)
            {
                await _recruiterProfileRepository.DeleteAsync(recruiter);
            }
        }

        /// <summary>
        /// Update profile dựa trên UserId - tự động detect Candidate/Employee/Recruiter
        /// </summary>
        private async Task UpdateUserProfileAsync(Guid userId, UpdatePersonalInfoDto input)
        {
            // Check CandidateProfile
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate != null)
            {
                candidate.DateOfbirth = input.DateOfBirth ?? candidate.DateOfbirth;
                candidate.Gender = input.Gender ?? candidate.Gender;
                candidate.Location = input.Location ?? candidate.Location;
                candidate.JobTitle = input.JobTitle ?? candidate.JobTitle;
                candidate.Skills = input.Skills ?? candidate.Skills;
                candidate.Experience = input.Experience ?? candidate.Experience;
                candidate.Salary = input.Salary ?? candidate.Salary;
                candidate.WorkLocation = input.WorkLocation ?? candidate.WorkLocation;
                await _candidateProfileRepository.UpdateAsync(candidate);
                
                // Auto-index vào Lucene
                try
                {
                    await _candidateIndexService.IndexCandidateAsync(candidate.UserId);
                }
                catch (Exception ex)
                {
                    // Log lỗi nhưng không throw để không ảnh hưởng đến flow chính
                    Logger.LogWarning(ex, "Lỗi khi auto-index candidate {UserId} vào Lucene", candidate.UserId);
                }
                
                return;
            }

            // Check EmployeeProfile
            var employee = await _employeeProfileRepository.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee != null)
            {
                employee.Description = input.Bio ?? employee.Description;
                await _employeeProfileRepository.UpdateAsync(employee);
                return;
            }

            // Check RecruiterProfile
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter != null)
            {
                await _recruiterProfileRepository.UpdateAsync(recruiter);
                return;
            }

            // Không tìm thấy profile -> throw exception
            throw new UserFriendlyException("Không tìm thấy thông tin profile. Vui lòng liên hệ quản trị viên.");
        }


        // lấy thông tin của 

        /// <summary>
        /// Get profile info dựa trên UserId - tự động detect Candidate/Employee/Recruiter
        /// </summary>
        private async Task<(string UserType, string Bio, DateTime? DateOfBirth, bool? Gender, string Location, string JobTitle, string Skills, int? Experience, decimal? Salary, string WorkLocation, bool? ProfileVisibility)>
            GetUserProfileInfoAsync(Guid userId)
        {
            // Check CandidateProfile
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate != null)
            {
                return ("Candidate", "", candidate.DateOfbirth, candidate.Gender, candidate.Location ?? "", 
                    candidate.JobTitle ?? "", candidate.Skills ?? "", candidate.Experience, 
                    candidate.Salary, candidate.WorkLocation ?? "", candidate.ProfileVisibility);
            }

            // Check EmployeeProfile
            var employee = await _employeeProfileRepository.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee != null)
            {
                return ("Employee", employee.Description ?? "", null, null, "", "", "", null, null, "", null);
            }

            // Check RecruiterProfile
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter != null)
            {
                return ("Recruiter", "", null, null, "", "", "", null, null, "", null);
            }

            // Không tìm thấy profile nào
            return ("Unknown", "", null, null, "", "", "", null, null, "", null);
        }

        /// <summary>
        /// Selects a company for the current recruiter user
        /// </summary>
        public async Task SelectCompanyAsync(SelectCompanyDto input)
        {
            var userId = _currentUser.GetId();
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);

            if (recruiter == null)
            {
                throw new UserFriendlyException("Không tìm thấy thông tin recruiter profile.");
            }

            recruiter.CompanyId = input.CompanyId;
            await _recruiterProfileRepository.UpdateAsync(recruiter);
        }

        /// <summary>
        /// Updates the profile visibility for the current candidate user
        /// </summary>
        public async Task UpdateProfileVisibilityAsync(bool isVisible)
        {
            var userId = _currentUser.GetId();
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);

            if (candidate == null)
            {
                throw new UserFriendlyException("Không tìm thấy thông tin candidate profile.");
            }

            candidate.ProfileVisibility = isVisible;
            await _candidateProfileRepository.UpdateAsync(candidate);
            
            // Auto-index vào Lucene (hoặc xóa nếu visibility = false)
            try
            {
                if (isVisible && candidate.Status)
                {
                    await _candidateIndexService.IndexCandidateAsync(candidate.UserId);
                }
                else
                {
                    // Nếu visibility = false hoặc status = false, xóa khỏi index
                    await _candidateIndexService.RemoveCandidateFromIndexAsync(candidate.UserId);
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến flow chính
                Logger.LogWarning(ex, "Lỗi khi auto-index candidate {UserId} vào Lucene", candidate.UserId);
            }
        }

        /// <summary>
        /// Updates the job seeking status (Status) for the current candidate user
        /// </summary>
        public async Task UpdateJobStatusAsync(bool isSeekingJob)
        {
            var userId = _currentUser.GetId();
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);

            if (candidate == null)
            {
                throw new UserFriendlyException("Không tìm thấy thông tin candidate profile.");
            }

            candidate.Status = isSeekingJob;
            await _candidateProfileRepository.UpdateAsync(candidate);

            // Auto-index vào Lucene hoặc xóa khỏi index dựa trên Status & ProfileVisibility
            try
            {
                if (candidate.Status && candidate.ProfileVisibility)
                {
                    await _candidateIndexService.IndexCandidateAsync(candidate.UserId);
                }
                else
                {
                    await _candidateIndexService.RemoveCandidateFromIndexAsync(candidate.UserId);
                }
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Lỗi khi auto-index candidate {UserId} vào Lucene", candidate.UserId);
            }
        }

    }
}