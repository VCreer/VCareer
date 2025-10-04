using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using VCareer.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Data;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using Volo.Abp.Validation;

namespace VCareer.Profile
{
    [Authorize(VCareerPermissions.Profile.Default)]
    public class ProfileAppService : VCareerAppService, IProfileAppService
    {
        private readonly IdentityUserManager _userManager;
        private readonly ICurrentUser _currentUser;

        public ProfileAppService(
            IdentityUserManager userManager,
            ICurrentUser currentUser)
        {
            _userManager = userManager;
            _currentUser = currentUser;
        }

        [Authorize(VCareerPermissions.Profile.UpdatePersonalInfo)]
        public async Task UpdatePersonalInfoAsync(UpdatePersonalInfoDto input)
        {
            var user = await _userManager.GetByIdAsync(_currentUser.GetId());
            
            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            // Update basic user information that can be set directly
            user.Name = input.Name;
            user.Surname = input.Surname;

            // Update Email using IdentityUserManager method
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

            // Update additional profile information stored in ExtraProperties
            user.SetProperty("Bio", input.Bio);
            user.SetProperty("DateOfBirth", input.DateOfBirth);
            user.SetProperty("Gender", input.Gender);
            user.SetProperty("Location", input.Location);
            user.SetProperty("Address", input.Address);
            user.SetProperty("Nationality", input.Nationality);
            user.SetProperty("MaritalStatus", input.MaritalStatus);

            var result = await _userManager.UpdateAsync(user);
            
            if (!result.Succeeded)
            {
                throw new UserFriendlyException($"Failed to update profile: {string.Join(", ", result.Errors)}");
            }
        }

        [Authorize(VCareerPermissions.Profile.ChangePassword)]
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

        public async Task<ProfileDto> GetCurrentUserProfileAsync()
        {
            var user = await _userManager.GetByIdAsync(_currentUser.GetId());
            
            if (user == null)
            {
                throw new UserFriendlyException("User not found.");
            }

            return new ProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Bio = user.GetProperty<string>("Bio"),
                DateOfBirth = user.GetProperty<DateTime?>("DateOfBirth"),
                Gender = user.GetProperty<bool?>("Gender"),
                Location = user.GetProperty<string>("Location"),
                Address = user.GetProperty<string>("Address"),
                Nationality = user.GetProperty<string>("Nationality"),
                MaritalStatus = user.GetProperty<string>("MaritalStatus"),
                UserName = user.UserName,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                CreationTime = user.CreationTime,
                LastModificationTime = user.LastModificationTime
            };
        }
    }
}
