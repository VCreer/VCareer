using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.CV;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.HttpApi.Controllers
{
    [ApiController]
    [Route("api/cv/templates")]
    [Authorize]
    public class CvTemplateController : AbpControllerBase
    {
        private readonly ICvTemplateAppService _templateAppService;

        public CvTemplateController(ICvTemplateAppService templateAppService)
        {
            _templateAppService = templateAppService;
        }

        /// <summary>
        /// Tạo mới CV Template (chỉ dành cho Admin)
        /// </summary>
        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<CvTemplateDto>> CreateAsync([FromBody] CreateCvTemplateDto input)
        {
            // Validate model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value.Errors.Count > 0)
                    .Select(x => new { Field = x.Key, Errors = x.Value.Errors.Select(e => e.ErrorMessage) })
                    .ToList();
                
                return BadRequest(new
                {
                    message = "Validation failed",
                    errors = errors
                });
            }

            // Validate required fields
            if (input == null)
            {
                return BadRequest(new { message = "Input is required" });
            }

            if (string.IsNullOrWhiteSpace(input.Name))
            {
                return BadRequest(new { message = "Name is required" });
            }

            if (string.IsNullOrWhiteSpace(input.LayoutDefinition))
            {
                return BadRequest(new { message = "LayoutDefinition is required" });
            }

            try
            {
                var result = await _templateAppService.CreateAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, details = ex.ToString() });
            }
        }

        /// <summary>
        /// Cập nhật CV Template (chỉ dành cho Admin)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<CvTemplateDto>> UpdateAsync(Guid id, [FromBody] UpdateCvTemplateDto input)
        {
            var result = await _templateAppService.UpdateAsync(id, input);
            return Ok(result);
        }

        /// <summary>
        /// Xóa CV Template (chỉ dành cho Admin)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(Guid id)
        {
            await _templateAppService.DeleteAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Lấy CV Template theo ID
        /// </summary>
        [HttpGet("{id}")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<CvTemplateDto>> GetAsync(Guid id)
        {
            var result = await _templateAppService.GetAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách CV Templates (có filter và pagination)
        /// </summary>
        [HttpGet]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult> GetListAsync([FromQuery] GetCvTemplateListDto input)
        {
            var result = await _templateAppService.GetListAsync(input);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách CV Templates đang active (cho candidate chọn)
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult> GetActiveTemplatesAsync([FromQuery] GetCvTemplateListDto input)
        {
            var result = await _templateAppService.GetActiveTemplatesAsync(input);
            return Ok(result);
        }

        /// <summary>
        /// Preview template với sample data (để candidate xem form/structure trước khi tạo CV)
        /// </summary>
        [HttpGet("{id}/preview")]
        [IgnoreAntiforgeryToken]
        public async Task<ActionResult<RenderCvDto>> PreviewTemplateAsync(Guid id)
        {
            var result = await _templateAppService.PreviewTemplateAsync(id);
            return Ok(result);
        }
    }
}

