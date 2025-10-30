using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Profile
{
    [ApiController]
    [Route("api/profile")]
    /*[Authorize]*/
    public class ProfileController : AbpControllerBase
    {
        private readonly IProfileAppService _profileAppService;

        public ProfileController(IProfileAppService profileAppService)
        {
            _profileAppService = profileAppService;
        }

        /// <summary>
        /// Gets the current user's profile information
        /// </summary>
        /// <returns>Current user's profile information</returns>
        [HttpGet]
        /*[Authorize(VCareerPermission.Profile.Default)]*/
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
        [Authorize(VCareerPermission.Profile.UpdatePersonalInfo)]
        public async Task<IActionResult> UpdatePersonalInfoAsync([FromBody] UpdatePersonalInfoDto input)
        {
            await _profileAppService.UpdatePersonalInfoAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Changes the current user's password
        /// </summary>
        /// <param name="input">Password change information</param>
        /// <returns>No content</returns>
        [HttpPut("change-password")]
        [Authorize(VCareerPermission.Profile.ChangePassword)]
        public async Task<IActionResult> ChangePasswordAsync([FromBody] ChangePasswordDto input)
        {
            await _profileAppService.ChangePasswordAsync(input);
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
