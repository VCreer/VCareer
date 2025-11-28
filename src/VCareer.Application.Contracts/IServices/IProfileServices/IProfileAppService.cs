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

        /// <summary>
        /// Verifies the current user's phone number
        /// </summary>
        Task VerifyPhoneNumberAsync(VerifyPhoneNumberDto input);

        /// <summary>
        /// Sends OTP code to email for verification
        /// </summary>
        Task SendEmailOtpAsync(SendEmailOtpDto input);

        /// <summary>
        /// Verifies the current user's email with OTP code
        /// </summary>
        Task VerifyEmailNumberAsync(VerifyEmailNumberDto input);

        /// <summary>
        /// Selects a company for the current recruiter user
        /// </summary>
        Task SelectCompanyAsync(SelectCompanyDto input);

        // lấy thông tin của 1 recruiter.  tu  userid của recruiter



    }
}
