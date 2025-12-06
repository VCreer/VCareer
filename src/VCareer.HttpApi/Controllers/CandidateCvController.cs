using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.CV;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.HttpApi.Controllers
{
    [ApiController]
    [Route("api/cv/candidates")]
    [Authorize]
    public class CandidateCvController : AbpControllerBase
    {
        private readonly ICandidateCvAppService _candidateCvAppService;

        public CandidateCvController(ICandidateCvAppService candidateCvAppService)
        {
            _candidateCvAppService = candidateCvAppService;
        }

        /// <summary>
        /// Tạo mới CV từ template
        /// </summary>
        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<CandidateCvDto>> CreateAsync([FromBody] CreateCandidateCvDto input)
        {
            var result = await _candidateCvAppService.CreateAsync(input);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật CV
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<CandidateCvDto>> UpdateAsync(Guid id, [FromBody] UpdateCandidateCvDto input)
        {
            var result = await _candidateCvAppService.UpdateAsync(id, input);
            return Ok(result);
        }

        /// <summary>
        /// Xóa CV
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(Guid id)
        {
            await _candidateCvAppService.DeleteAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Lấy CV theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CandidateCvDto>> GetAsync(Guid id)
        {
            var result = await _candidateCvAppService.GetAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách CV của candidate hiện tại
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetListAsync([FromQuery] GetCandidateCvListDto input)
        {
            var result = await _candidateCvAppService.GetListAsync(input);
            return Ok(result);
        }

        /// <summary>
        /// Render CV thành HTML (áp dụng template và data)
        /// </summary>
        [HttpGet("{id}/render")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<RenderCvDto>> RenderCvAsync(Guid id)
        {
            var result = await _candidateCvAppService.RenderCvAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Set CV làm mặc định
        /// </summary>
        [HttpPost("{id}/set-default")]
        public async Task<IActionResult> SetDefaultAsync(Guid id)
        {
            await _candidateCvAppService.SetDefaultAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Publish/Unpublish CV
        /// </summary>
        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishAsync(Guid id, [FromBody] bool isPublished)
        {
            await _candidateCvAppService.PublishAsync(id, isPublished);
            return NoContent();
        }

        /// <summary>
        /// Tăng view count (khi recruiter xem CV)
        /// </summary>
        [HttpPost("{id}/increment-view")]
        public async Task<IActionResult> IncrementViewCountAsync(Guid id)
        {
            await _candidateCvAppService.IncrementViewCountAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Lấy CV mặc định của candidate hiện tại
        /// </summary>
        [HttpGet("default")]
        public async Task<ActionResult<CandidateCvDto>> GetDefaultCvAsync()
        {
            var result = await _candidateCvAppService.GetDefaultCvAsync();
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật preview image của CV
        /// </summary>
        [HttpPut("{id}/preview-image")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> UpdatePreviewImageAsync(Guid id, [FromBody] UpdatePreviewImageDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.PreviewImageUrl))
            {
                return BadRequest("Preview image URL cannot be empty");
            }
            
            await _candidateCvAppService.UpdatePreviewImageAsync(id, dto.PreviewImageUrl);
            return NoContent();
        }
    }

    /// <summary>
    /// DTO để update preview image
    /// </summary>
    public class UpdatePreviewImageDto
    {
        public string PreviewImageUrl { get; set; } = string.Empty;
    }
    }


