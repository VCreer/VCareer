using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VCareer.Application.Contracts.CV;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.HttpApi.Controllers
{
    /// <summary>
    /// API Controller cho Uploaded CV Management
    /// </summary>
    [Route("api/cv/uploaded")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class UploadedCvController : AbpControllerBase
    {
        private readonly IUploadedCvAppService _uploadedCvAppService;

        public UploadedCvController(IUploadedCvAppService uploadedCvAppService)
        {
            _uploadedCvAppService = uploadedCvAppService;
        }

        /// <summary>
        /// Upload CV file
        /// </summary>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [IgnoreAntiforgeryToken]
        [ProducesResponseType(typeof(UploadedCvDto), 200)]
        public async Task<ActionResult<UploadedCvDto>> UploadCvAsync([FromForm] UploadCvRequestDto input)
        {
            if (input == null || input.File == null || input.File.Length == 0)
            {
                return BadRequest("File is required.");
            }

            if (string.IsNullOrWhiteSpace(input.CvName))
            {
                return BadRequest("CV name is required.");
            }

            try
            {
                var result = await _uploadedCvAppService.UploadCvAsync(
                    input.File, 
                    input.CvName, 
                    input.IsDefault, 
                    input.IsPublic, 
                    input.Notes);
                return Ok(result);
            }
            catch (Volo.Abp.UserFriendlyException ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.Details });
            }
            catch (Exception ex)
            {
                // Log full exception for debugging
                var innerMessage = ex.InnerException?.Message ?? "";
                var stackTrace = ex.StackTrace ?? "";
                return StatusCode(500, new { 
                    message = ex.Message, 
                    innerException = innerMessage,
                    stackTrace = stackTrace.Substring(0, Math.Min(500, stackTrace.Length))
                });
            }
        }

        /// <summary>
        /// Lấy danh sách Uploaded CVs
        /// </summary>
        [HttpGet]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult> GetListAsync([FromQuery] GetUploadedCvListDto input)
        {
            try
            {
                var result = await _uploadedCvAppService.GetListAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy Uploaded CV theo ID
        /// </summary>
        [HttpGet("{id}")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<UploadedCvDto>> GetAsync(Guid id)
        {
            try
            {
                var result = await _uploadedCvAppService.GetAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật Uploaded CV
        /// </summary>
        [HttpPut("{id}")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<UploadedCvDto>> UpdateAsync(Guid id, [FromBody] UpdateUploadedCvDto input)
        {
            try
            {
                var result = await _uploadedCvAppService.UpdateAsync(id, input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Xóa Uploaded CV
        /// </summary>
        [HttpDelete("{id}")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult> DeleteAsync(Guid id)
        {
            try
            {
                await _uploadedCvAppService.DeleteAsync(id);
                return Ok(new { message = "CV deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Đặt CV làm mặc định
        /// </summary>
        [HttpPost("{id}/set-default")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult> SetDefaultAsync(Guid id)
        {
            try
            {
                await _uploadedCvAppService.SetDefaultAsync(id);
                return Ok(new { message = "CV set as default successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Download CV file
        /// </summary>
        [HttpGet("{id}/download")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult> DownloadCvAsync(Guid id, [FromQuery] bool inline = true)
        {
            try
            {
                var fileBytes = await _uploadedCvAppService.DownloadCvAsync(id);
                
                // Lấy file descriptor để biết tên file và mime type
                var uploadedCv = await _uploadedCvAppService.GetAsync(id);
                var fileName = uploadedCv.OriginalFileName ?? $"CV_{id}.pdf";
                var mimeType = uploadedCv.FileDescriptor?.MimeType ?? "application/pdf";

                // Nếu inline = true, hiển thị PDF trong browser (giống mở file trên máy)
                // Nếu inline = false, download file
                var contentDisposition = inline 
                    ? $"inline; filename=\"{fileName}\"" 
                    : $"attachment; filename=\"{fileName}\"";
                
                var result = File(fileBytes, mimeType);
                result.FileDownloadName = fileName;
                
                // Set Content-Disposition header để browser hiển thị inline
                Response.Headers.Append("Content-Disposition", contentDisposition);
                
                return result;
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
