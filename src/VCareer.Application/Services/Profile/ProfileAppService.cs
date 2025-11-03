using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using VCareer.Model;
using VCareer.Models.Users;
using VCareer.Permission;
using VCareer.Permissions;
using VCareer.Profile;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Data;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Volo.Abp.Validation;

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

        public ProfileAppService(
            IdentityUserManager userManager,
            ICurrentUser currentUser,
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            IRepository<EmployeeProfile, Guid> employeeProfileRepository,
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository)
        {
            _userManager = userManager;
            _currentUser = currentUser;
            _candidateProfileRepository = candidateProfileRepository;
            _employeeProfileRepository = employeeProfileRepository;
            _recruiterProfileRepository = recruiterProfileRepository;
        }

        //ádadad

        [Authorize(VCareerPermission.Profile.UpdatePersonalInfo)]
        public async Task UpdatePersonalInfoAsync(UpdatePersonalInfoDto input)
        {
            var user = await _userManager.GetByIdAsync(_currentUser.GetId());


            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // 1. Update basic user information in IdentityUser
            user.Name = input.Name;
            user.Surname = input.Surname;

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
                var phoneResult = await _userManager.SetPhoneNumberAsync(user, input.PhoneNumber);
                if (!phoneResult.Succeeded)
                {
                    throw new UserFriendlyException($"Failed to update phone number: {string.Join(", ", phoneResult.Errors)}");
                }
            }

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
        [Authorize(VCareerPermission.Profile.ChangePassword)]
        public async Task ChangePasswordAsync(ChangePasswordDto input)
        {
            var user = await _userManager.GetByIdAsync(_currentUser.GetId());

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


        // lấy thông tin id hiện tại
        public async Task<ProfileDto> GetCurrentUserProfileAsync()
        {


            // ✅ Debug: In ra tất cả claims
            var claims = _currentUser.GetAllClaims();
            foreach (var claim in claims)
            {
                Console.WriteLine($"Claim: {claim.Type} = {claim.Value}");
            }

            // ✅ Kiểm tra xem có UserId không
            if (!_currentUser.IsAuthenticated)
            {
                throw new UserFriendlyException("User not authenticated.");
            }


            var user = await _userManager.GetByIdAsync(_currentUser.GetId());

            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // Get profile info từ Candidate/Employee/Recruiter table
            var (userType, bio, dateOfBirth, gender, location) = await GetUserProfileInfoAsync(user.Id);

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
                UserType = userType
            };
        }



        [Authorize(VCareerPermission.Profile.DeleteAccount)]
        public async Task DeleteAccountAsync()
        {
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
                await _candidateProfileRepository.UpdateAsync(candidate);
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
                // RecruiterProfile có ít fields để update
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
        private async Task<(string UserType, string Bio, DateTime? DateOfBirth, bool? Gender, string Location)>
            GetUserProfileInfoAsync(Guid userId)
        {
            // Check CandidateProfile
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate != null)
            {
                return ("Candidate", "", candidate.DateOfbirth, candidate.Gender, candidate.Location);
            }

            // Check EmployeeProfile
            var employee = await _employeeProfileRepository.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee != null)
            {
                return ("Employee", employee.Description, null, null, "");
            }

            // Check RecruiterProfile
            var recruiter = await _recruiterProfileRepository.FirstOrDefaultAsync(r => r.UserId == userId);
            if (recruiter != null)
            {
                return ("Recruiter", "", null, null, "");
            }

            // Không tìm thấy profile nào
            return ("Unknown", "", null, null, "");
        }


    }
}
