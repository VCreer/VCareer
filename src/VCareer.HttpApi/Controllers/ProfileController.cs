using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VCareer.Dto.Profile;
using VCareer.IServices.IProfileServices;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Profile
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : AbpControllerBase
    {
        private readonly IProfileAppService _profileAppService;

        public ProfileController(IProfileAppService profileAppService)
        {
            _profileAppService = profileAppService;
        }

        // lấy profile hiện tại
        [HttpGet]
        public async Task<ProfileDto> GetCurrentUserProfileAsync()
        {
            return await _profileAppService.GetCurrentUserProfileAsync();
        }

        /// <summary>
        /// Updates the current user's personal information
        /// </summary>
        /// <param name="input">Personal information to update</param>
        /// <returns>No content</returns>
        [HttpPut("personal-info")]
        [IgnoreAntiforgeryToken] // Disable antiforgery token validation cho API endpoint
        [DisableRequestSizeLimit] // Disable request size limit nếu cần
        [Authorize(VCareerPermission.Profile.UpdatePersonalInfo)]
        public async Task<IActionResult> UpdatePersonalInfoAsync([FromBody] UpdatePersonalInfoDto input)
        {
            // Check if input is null
            if (input == null)
            {
                Logger.LogWarning("UpdatePersonalInfoAsync: input is null");
                return BadRequest(new { error = "Request body cannot be null" });
            }

            // Log input để debug
            try
            {
                Logger.LogInformation($"UpdatePersonalInfoAsync called with input: Name='{input?.Name}', Surname='{input?.Surname}', Email='{input?.Email}', PhoneNumber='{input?.PhoneNumber}', DateOfBirth={input?.DateOfBirth}, Gender={input?.Gender}, Location='{input?.Location}', Address='{input?.Address}'");
            }
            catch (Exception ex)
            {
                Logger.LogWarning($"Error logging input: {ex.Message}");
            }

            // Check ModelState validation errors
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .Select(x => new {
                        Field = x.Key,
                        Errors = x.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                    })
                    .ToList();

                Logger.LogWarning($"Validation errors in UpdatePersonalInfoAsync: {System.Text.Json.JsonSerializer.Serialize(errors)}");

                // Return detailed validation errors
                var problemDetails = new Microsoft.AspNetCore.Mvc.ValidationProblemDetails(ModelState)
                {
                    Title = "Validation Error",
                    Status = 400
                };

                return BadRequest(problemDetails);
            }

            await _profileAppService.UpdatePersonalInfoAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Changes the current user's password
        /// </summary>
        /// <param name="input">Password change information</param>
        /// <returns>No content</returns>
        [HttpPut("change-password")]
        [IgnoreAntiforgeryToken]
        [Authorize(VCareerPermission.Profile.ChangePassword)]
        public async Task<IActionResult> ChangePasswordAsync([FromBody] ChangePasswordDto input)
        {
            await _profileAppService.ChangePasswordAsync(input);
            return NoContent();
        }

        [HttpPost("verify-phone")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> VerifyPhoneNumberAsync([FromBody] VerifyPhoneNumberDto input)
        {
            await _profileAppService.VerifyPhoneNumberAsync(input);
            return NoContent();
        }

        [HttpPost("send-email-otp")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SendEmailOtpAsync([FromBody] SendEmailOtpDto input)
        {
            await _profileAppService.SendEmailOtpAsync(input);
            return NoContent();
        }

        [HttpPost("verify-email")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> VerifyEmailNumberAsync([FromBody] VerifyEmailNumberDto input)
        {
            await _profileAppService.VerifyEmailNumberAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Selects a company for the current recruiter user
        /// </summary>
        /// <param name="input">Company selection information</param>
        /// <returns>No content</returns>
        [HttpPost("select-company")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SelectCompanyAsync([FromBody] SelectCompanyDto input)
        {
            await _profileAppService.SelectCompanyAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Soft deletes the current user's account
        /// </summary>
        /// <returns>No content</returns>
        [HttpDelete("account")]
        [Authorize(VCareerPermission.Profile.DeleteAccount)]
        public async Task<IActionResult> DeleteAccountAsync()
        {
            await _profileAppService.DeleteAccountAsync();
            return NoContent();
        }
    }
}