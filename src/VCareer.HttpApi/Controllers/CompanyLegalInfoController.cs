using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.Dto.Profile;
using VCareer.IServices.IProfileServices;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Profile
{
    [ApiController]
    [Route("api/profile/company-legal-info")]
    //  [Authorize]
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
        /// Tìm kiếm danh sách công ty (public API)
        /// Phải đặt trước route {id} để tránh conflict
        /// </summary>
        /// <param name="input">Input tìm kiếm</param>
        /// <returns>Danh sách công ty đã phân trang</returns>
        [HttpPost("search")]
        public async Task<ActionResult<PagedResultDto<CompanyLegalInfoDto>>> SearchCompaniesAsync([FromBody] CompanySearchInputDto input)
        {
            try
            {
                // Validate input
                if (input == null)
                {
                    return BadRequest(new { message = "Input không được để trống" });
                }

                // Đảm bảo maxResultCount có giá trị hợp lệ
                if (input.MaxResultCount <= 0)
                {
                    input.MaxResultCount = 10; // Default
                }

                if (input.SkipCount < 0)
                {
                    input.SkipCount = 0;
                }

                var result = await _companyLegalInfoAppService.SearchCompaniesAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tìm kiếm công ty", error = ex.Message });
            }
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

        ///lấy công ty
        [HttpGet("by-job/{jobId}")]
        public async Task<CompanyInfoForJobDetailDto> GetCompanyByJobIdAsync(Guid jobId)
        {
            return await _companyLegalInfoAppService.GetCompanyByJobIdAsync(jobId);
        }
    }
}
