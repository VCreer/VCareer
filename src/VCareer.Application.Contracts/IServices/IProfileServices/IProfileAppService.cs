using System;
using System.Threading.Tasks;
using VCareer.Dto.Profile;
using VCareer.Model;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IProfileServices
{
    public interface IProfileAppService : IApplicationService
    {
        /// <summary>
        /// Updates the current user's personal information
        /// </summary>
        /// <param name="input">Personal information to update</param>
        /// <returns>Updated user information</returns>
        Task UpdatePersonalInfoAsync(UpdatePersonalInfoDto input);

        /// <summary>
        /// Changes the current user's password
        /// </summary>
        /// <param name="input">Password change information</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task ChangePasswordAsync(ChangePasswordDto input);

        /// <summary>
        /// Gets the current user's profile information
        /// </summary>
        /// <returns>Current user's profile information</returns>
        Task<ProfileDto> GetCurrentUserProfileAsync();

        /// <summary>
        /// Soft deletes the current user's account
        /// </summary>
        /// <returns>Task representing the asynchronous operation</returns>
        Task DeleteAccountAsync();

        // lấy thông tin của 1 recruiter.  tu  userid của recruiter



    }
}
