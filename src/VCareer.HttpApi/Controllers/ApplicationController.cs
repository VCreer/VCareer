using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using VCareer.Application.Contracts.Applications;
using VCareer.Application.Contracts.Permissions;
using VCareer.Controllers;

namespace VCareer.HttpApi.Controllers
{
    /// <summary>
    /// Application Management Controller
    /// </summary>
    [ApiController]
    [Route("api/applications")]
    [Authorize(VCareerPermissions.Application.Default)]
    public class ApplicationController : VCareerController
    {
        private readonly IApplicationAppService _applicationAppService;

        public ApplicationController(IApplicationAppService applicationAppService)
        {
            _applicationAppService = applicationAppService;
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV từ thư viện
        /// </summary>
        [HttpPost("apply-with-library-cv")]
        [Authorize(VCareerPermissions.Application.Apply)]
        public async Task<ApplicationDto> ApplyWithLibraryCVAsync([FromBody] ApplyWithLibraryCVDto input)
        {
            return await _applicationAppService.ApplyWithLibraryCVAsync(input);
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV tải lên mới
        /// </summary>
        [HttpPost("apply-with-upload-cv")]
        [Authorize(VCareerPermissions.Application.Apply)]
        public async Task<ApplicationDto> ApplyWithUploadCVAsync([FromForm] ApplyWithUploadCVDto input)
        {
            return await _applicationAppService.ApplyWithUploadCVAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển
        /// </summary>
        [HttpGet]
        [Authorize(VCareerPermissions.Application.View)]
        public async Task<PagedResultDto<ApplicationDto>> GetApplicationListAsync([FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn ứng tuyển
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(VCareerPermissions.Application.View)]
        public async Task<ApplicationDto> GetApplicationAsync(Guid id)
        {
            return await _applicationAppService.GetApplicationAsync(id);
        }

        /// <summary>
        /// Cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<ApplicationDto> UpdateApplicationStatusAsync(Guid id, [FromBody] UpdateApplicationStatusDto input)
        {
            return await _applicationAppService.UpdateApplicationStatusAsync(id, input);
        }

        /// <summary>
        /// Hủy đơn ứng tuyển (cho ứng viên)
        /// </summary>
        [HttpPut("{id}/withdraw")]
        [Authorize(VCareerPermissions.Application.Withdraw)]
        public async Task<ApplicationDto> WithdrawApplicationAsync(Guid id, [FromBody] WithdrawApplicationDto input)
        {
            return await _applicationAppService.WithdrawApplicationAsync(id, input);
        }

        /// <summary>
        /// Đánh dấu đã xem đơn ứng tuyển
        /// </summary>
        [HttpPut("{id}/mark-viewed")]
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<ApplicationDto> MarkAsViewedAsync(Guid id)
        {
            return await _applicationAppService.MarkAsViewedAsync(id);
        }

        /// <summary>
        /// Lấy thống kê đơn ứng tuyển
        /// </summary>
        [HttpGet("statistics")]
        [Authorize(VCareerPermissions.Application.Statistics)]
        public async Task<ApplicationStatisticsDto> GetApplicationStatisticsAsync([FromQuery] Guid? jobId = null, [FromQuery] Guid? companyId = null)
        {
            return await _applicationAppService.GetApplicationStatisticsAsync(jobId, companyId);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của ứng viên
        /// </summary>
        [HttpGet("my-applications")]
        [Authorize(VCareerPermissions.Application.View)]
        public async Task<PagedResultDto<ApplicationDto>> GetMyApplicationsAsync([FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetMyApplicationsAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của công ty
        /// </summary>
        [HttpGet("company-applications")]
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetCompanyApplicationsAsync([FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetCompanyApplicationsAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển cho một công việc cụ thể
        /// </summary>
        [HttpGet("job/{jobId}")]
        [Authorize(VCareerPermissions.Application.Manage)]
        public async Task<PagedResultDto<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, [FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetJobApplicationsAsync(jobId, input);
        }

        /// <summary>
        /// Tải xuống CV của đơn ứng tuyển
        /// </summary>
        [HttpGet("{id}/download-cv")]
        [Authorize(VCareerPermissions.Application.DownloadCV)]
        public async Task<IActionResult> DownloadApplicationCVAsync(Guid id)
        {
            var fileBytes = await _applicationAppService.DownloadApplicationCVAsync(id);
            var fileName = $"CV_Application_{id}.pdf";
            
            return File(fileBytes, "application/pdf", fileName);
        }

        /// <summary>
        /// Xóa đơn ứng tuyển (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(VCareerPermissions.Application.Delete)]
        public async Task DeleteApplicationAsync(Guid id)
        {
            await _applicationAppService.DeleteApplicationAsync(id);
        }
    }
}

