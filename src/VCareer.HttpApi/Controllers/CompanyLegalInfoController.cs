using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using VCareer.Dto.FileDto;
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
        [IgnoreAntiforgeryToken]
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
        /// Upload Giấy đăng ký doanh nghiệp (legal document) cho công ty
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <param name="file">File giấy tờ</param>
        /// <returns>Thông tin công ty sau khi cập nhật</returns>
        [HttpPost("{id}/upload-legal-document")]
        [Consumes("multipart/form-data")]
        [IgnoreAntiforgeryToken]
        public async Task<CompanyLegalInfoDto> UploadLegalDocumentAsync(int id, [FromForm] UploadLegalDocumentInputDto input)
        {
            return await _companyLegalInfoAppService.UploadLegalDocumentAsync(id, input.File);
        }

        /// <summary>
        /// Download/Xem file Giấy đăng ký doanh nghiệp theo storagePath
        /// </summary>
        /// <param name="storagePath">Giá trị lưu trong Company.LegalDocumentUrl</param>
        /// <returns>File stream</returns>
        [HttpGet("legal-document")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> GetLegalDocumentAsync([FromQuery] string storagePath)
        {
            var fileResult = await _companyLegalInfoAppService.GetLegalDocumentFileAsync(storagePath);

            // Hiển thị trực tiếp trên tab mới (inline), không bắt tải về
            Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileResult.FileName}\"";
            return File(fileResult.Data, fileResult.MimeType);
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

        /// <summary>
        /// Lấy danh sách công ty chờ xác thực (chỉ Employee/Admin)
        /// </summary>
        /// <param name="input">Filter và pagination</param>
        /// <returns>Danh sách công ty chờ xác thực</returns>
        [HttpPost("pending-companies")]
        [Authorize]
        public async Task<ActionResult<PagedResultDto<CompanyVerificationViewDto>>> GetPendingCompaniesAsync([FromBody] CompanyVerificationFilterDto input)
        {
            try
            {
                if (input == null)
                {
                    input = new CompanyVerificationFilterDto
                    {
                        MaxResultCount = 10,
                        SkipCount = 0
                    };
                }

                if (input.MaxResultCount <= 0)
                {
                    input.MaxResultCount = 10;
                }

                if (input.SkipCount < 0)
                {
                    input.SkipCount = 0;
                }

                var result = await _companyLegalInfoAppService.GetPendingCompaniesAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách công ty chờ xác thực", error = ex.Message });
            }
        }

        /// <summary>
        /// Duyệt công ty (chỉ Employee/Admin)
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <returns>No content</returns>
        [HttpPost("{id}/approve")]
        [Authorize]
        public async Task<IActionResult> ApproveCompanyAsync(int id)
        {
            try
            {
                await _companyLegalInfoAppService.ApproveCompanyAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi duyệt công ty", error = ex.Message });
            }
        }

        /// <summary>
        /// Từ chối công ty (chỉ Employee/Admin)
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <param name="input">Lý do từ chối</param>
        /// <returns>No content</returns>
        [HttpPost("{id}/reject")]
        [Authorize]
        public async Task<IActionResult> RejectCompanyAsync(int id, [FromBody] RejectCompanyDto input)
        {
            try
            {
                await _companyLegalInfoAppService.RejectCompanyAsync(id, input);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi từ chối công ty", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách công ty đã được xác minh (chỉ Employee/Admin)
        /// </summary>
        /// <param name="input">Filter và pagination</param>
        /// <returns>Danh sách công ty đã được xác minh</returns>
        [HttpPost("verified-companies")]
        [Authorize]
        public async Task<ActionResult<PagedResultDto<CompanyVerificationViewDto>>> GetVerifiedCompaniesAsync([FromBody] CompanyVerificationFilterDto input)
        {
            try
            {
                if (input == null)
                {
                    input = new CompanyVerificationFilterDto
                    {
                        MaxResultCount = 10,
                        SkipCount = 0
                    };
                }

                if (input.MaxResultCount <= 0)
                {
                    input.MaxResultCount = 10;
                }

                if (input.SkipCount < 0)
                {
                    input.SkipCount = 0;
                }

                var result = await _companyLegalInfoAppService.GetVerifiedCompaniesAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách công ty đã xác minh", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách công ty đã bị từ chối (chỉ Employee/Admin)
        /// </summary>
        /// <param name="input">Filter và pagination</param>
        /// <returns>Danh sách công ty đã bị từ chối</returns>
        [HttpPost("rejected-companies")]
        [Authorize]
        public async Task<ActionResult<PagedResultDto<CompanyVerificationViewDto>>> GetRejectedCompaniesAsync([FromBody] CompanyVerificationFilterDto input)
        {
            try
            {
                if (input == null)
                {
                    input = new CompanyVerificationFilterDto
                    {
                        MaxResultCount = 10,
                        SkipCount = 0
                    };
                }

                if (input.MaxResultCount <= 0)
                {
                    input.MaxResultCount = 10;
                }

                if (input.SkipCount < 0)
                {
                    input.SkipCount = 0;
                }

                var result = await _companyLegalInfoAppService.GetRejectedCompaniesAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách công ty đã bị từ chối", error = ex.Message });
            }
        }
    }
}
