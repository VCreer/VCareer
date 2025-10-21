using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Profile
{
    [ApiController]
    [Route("api/profile/company-legal-info")]
    [Authorize]
    public class CompanyLegalInfoController : AbpControllerBase
    {
        private readonly ICompanyLegalInfoAppService _companyLegalInfoAppService;

        public CompanyLegalInfoController(ICompanyLegalInfoAppService companyLegalInfoAppService)
        {
            _companyLegalInfoAppService = companyLegalInfoAppService;
        }

        /// <summary>
        /// Submits company legal information for the current user
        /// </summary>
        /// <param name="input">Company legal information to submit</param>
        /// <returns>Created company legal information</returns>
        [HttpPost]
        [Authorize(VCareerPermission.Profile.SubmitLegalInformation)]
        public async Task<CompanyLegalInfoDto> SubmitCompanyLegalInfoAsync([FromBody] SubmitCompanyLegalInfoDto input)
        {
            return await _companyLegalInfoAppService.SubmitCompanyLegalInfoAsync(input);
        }

        /// <summary>
        /// Updates existing company legal information
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <param name="input">Updated company legal information</param>
        /// <returns>Updated company legal information</returns>
        [HttpPut("{id}")]
        [Authorize(VCareerPermission.Profile.UpdateLegalInformation)]
        public async Task<CompanyLegalInfoDto> UpdateCompanyLegalInfoAsync(int id, [FromBody] UpdateCompanyLegalInfoDto input)
        {
            return await _companyLegalInfoAppService.UpdateCompanyLegalInfoAsync(id, input);
        }

        /// <summary>
        /// Gets company legal information by ID
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <returns>Company legal information</returns>
        [HttpGet("{id}")]
        public async Task<CompanyLegalInfoDto> GetCompanyLegalInfoAsync(int id)
        {
            return await _companyLegalInfoAppService.GetCompanyLegalInfoAsync(id);
        }

        /// <summary>
        /// Gets company legal information for the current user
        /// </summary>
        /// <returns>Company legal information</returns>
        [HttpGet("current-user")]
        public async Task<CompanyLegalInfoDto> GetCurrentUserCompanyLegalInfoAsync()
        {
            return await _companyLegalInfoAppService.GetCurrentUserCompanyLegalInfoAsync();
        }

        /// <summary>
        /// Gets all company legal information for the current user
        /// </summary>
        /// <returns>List of company legal information</returns>
        [HttpGet("current-user/list")]
        public async Task<List<CompanyLegalInfoDto>> GetCurrentUserCompanyLegalInfoListAsync()
        {
            return await _companyLegalInfoAppService.GetCurrentUserCompanyLegalInfoListAsync();
        }

        /// <summary>
        /// Updates file URLs for company legal information
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <param name="businessLicenseFile">Business license file URL</param>
        /// <param name="taxCertificateFile">Tax certificate file URL</param>
        /// <param name="representativeIdCardFile">Representative ID card file URL</param>
        /// <param name="otherSupportFile">Other support file URL</param>
        /// <returns>Updated company legal information</returns>
        [HttpPut("{id}/files")]
        [Authorize(VCareerPermission.Profile.UpdateLegalInformation)]
        public async Task<CompanyLegalInfoDto> UpdateFileUrlsAsync(int id, 
            [FromQuery] string businessLicenseFile = null,
            [FromQuery] string taxCertificateFile = null,
            [FromQuery] string representativeIdCardFile = null,
            [FromQuery] string otherSupportFile = null)
        {
            return await _companyLegalInfoAppService.UpdateFileUrlsAsync(id, businessLicenseFile, 
                taxCertificateFile, representativeIdCardFile, otherSupportFile);
        }

        /// <summary>
        /// Deletes company legal information
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <returns>No content</returns>
        [HttpDelete("{id}")]
        [Authorize(VCareerPermission.Profile.DeleteSupportingDocument)]
        public async Task<IActionResult> DeleteCompanyLegalInfoAsync(int id)
        {
            await _companyLegalInfoAppService.DeleteCompanyLegalInfoAsync(id);
            return NoContent();
        }
    }
}
