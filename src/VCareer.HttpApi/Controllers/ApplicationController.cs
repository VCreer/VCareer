using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.Application.Dtos;
using VCareer.Application.Contracts.Applications;
using VCareer.Controllers;

namespace VCareer.HttpApi.Controllers
{
    /// <summary>
    /// Application Management Controller
    /// </summary>
    [ApiController]
    [Route("api/applications")]
    [Authorize]
    public class ApplicationController : VCareerController
    {
        private readonly IApplicationAppService _applicationAppService;

        public ApplicationController(IApplicationAppService applicationAppService)
        {
            _applicationAppService = applicationAppService;
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV online (CandidateCv)
        /// </summary>
        [HttpPost("apply-with-online-cv")]
        public async Task<ApplicationDto> ApplyWithOnlineCVAsync([FromBody] ApplyWithOnlineCVDto input)
        {
            return await _applicationAppService.ApplyWithOnlineCVAsync(input);
        }

        /// <summary>
        /// Nộp đơn ứng tuyển với CV đã tải lên (UploadedCv)
        /// </summary>
        [HttpPost("apply-with-uploaded-cv")]
        public async Task<ApplicationDto> ApplyWithUploadedCVAsync([FromBody] ApplyWithUploadedCVDto input)
        {
            return await _applicationAppService.ApplyWithUploadedCVAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển
        /// </summary>
        [HttpGet]
        public async Task<PagedResultDto<ApplicationDto>> GetApplicationListAsync([FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetApplicationListAsync(input);
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn ứng tuyển
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ApplicationDto> GetApplicationAsync(Guid id)
        {
            return await _applicationAppService.GetApplicationAsync(id);
        }

        /// <summary>
        /// Cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ApplicationDto> UpdateApplicationStatusAsync(Guid id, [FromBody] UpdateApplicationStatusDto input)
        {
            return await _applicationAppService.UpdateApplicationStatusAsync(id, input);
        }

        /// <summary>
        /// Hủy đơn ứng tuyển (cho ứng viên)
        /// </summary>
        [HttpPut("{id}/withdraw")]
        public async Task<ApplicationDto> WithdrawApplicationAsync(Guid id, [FromBody] WithdrawApplicationDto input)
        {
            return await _applicationAppService.WithdrawApplicationAsync(id, input);
        }

        /// <summary>
        /// Đánh dấu đã xem đơn ứng tuyển
        /// </summary>
        [HttpPut("{id}/mark-viewed")]
        public async Task<ApplicationDto> MarkAsViewedAsync(Guid id)
        {
            return await _applicationAppService.MarkAsViewedAsync(id);
        }

        /// <summary>
        /// Lấy thống kê đơn ứng tuyển
        /// </summary>
        [HttpGet("statistics")]
        public async Task<ApplicationStatisticsDto> GetApplicationStatisticsAsync([FromQuery] Guid? jobId = null, [FromQuery] int? companyId = null)
        {
            return await _applicationAppService.GetApplicationStatisticsAsync(jobId, companyId);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của ứng viên
        /// </summary>
        [HttpGet("my-applications")]
        public async Task<PagedResultDto<ApplicationDto>> GetMyApplicationsAsync([FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetMyApplicationsAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của công ty
        /// </summary>
        [HttpGet("company-applications")]
        public async Task<PagedResultDto<ApplicationDto>> GetCompanyApplicationsAsync([FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetCompanyApplicationsAsync(input);
        }

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển cho một công việc cụ thể
        /// </summary>
        [HttpGet("job/{jobId}")]
        public async Task<PagedResultDto<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, [FromQuery] GetApplicationListDto input)
        {
            return await _applicationAppService.GetJobApplicationsAsync(jobId, input);
        }

        /// <summary>
        /// Tải xuống CV của đơn ứng tuyển (PDF hoặc render HTML)
        /// </summary>
        [HttpPost("{id}/download-application-cv")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> DownloadApplicationCVAsync(Guid id)
        {
            var result = await _applicationAppService.DownloadApplicationCVWithInfoAsync(id);
            
            return File(result.FileBytes, result.ContentType, result.FileName);
        }

        /// <summary>
        /// Tải xuống hàng loạt CV của các ứng viên đã ứng tuyển vào công ty
        /// Dành cho Leader Recruiter (IsLead = 1) và HR Staff (IsLead = 0)
        /// </summary>
        [HttpPost("bulk-download-cvs")]
        public async Task<IActionResult> BulkDownloadCompanyCVsAsync([FromBody] BulkDownloadCVsDto input)
        {
            var zipBytes = await _applicationAppService.BulkDownloadCompanyCVsAsync(input);
            var fileName = $"Company_CVs_{DateTime.UtcNow:yyyyMMdd_HHmmss}.zip";
            
            return File(zipBytes, "application/zip", fileName);
        }

        /// <summary>
        /// Đánh giá ứng viên (Rating từ 1-10)
        /// </summary>
        [HttpPost("{id}/rate")]
        public async Task<ApplicationDto> RateApplicationAsync(Guid id, [FromBody] RateApplicationDto input)
        {
            return await _applicationAppService.RateApplicationAsync(id, input);
        }

        /// <summary>
        /// Xóa đơn ứng tuyển (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task DeleteApplicationAsync(Guid id)
        {
            await _applicationAppService.DeleteApplicationAsync(id);
        }
    }
}
