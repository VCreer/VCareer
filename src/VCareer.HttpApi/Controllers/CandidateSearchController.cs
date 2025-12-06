using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.Dto.Profile;
using VCareer.IServices.IProfileServices;
using VCareer.Permission;
using VCareer.Permissions;
using VCareer.Services.LuceneService.CandidateSearch;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Profile
{
    [ApiController]
    [Route("api/candidate-search")]
    [IgnoreAntiforgeryToken]
    /*[Authorize(VCareerPermission.Profile.Default)]*/
    public class CandidateSearchController : AbpControllerBase
    {
        private readonly ICandidateSearchAppService _candidateSearchAppService;
        private readonly CandidateIndexService _candidateIndexService;

        public CandidateSearchController(
            ICandidateSearchAppService candidateSearchAppService,
            CandidateIndexService candidateIndexService)
        {
            _candidateSearchAppService = candidateSearchAppService;
            _candidateIndexService = candidateIndexService;
        }

        /// <summary>
        /// Tìm kiếm ứng viên dựa trên các tiêu chí
        /// </summary>
        /// <param name="input">Thông tin tìm kiếm</param>
        /// <returns>Danh sách ứng viên phù hợp</returns>
        [HttpPost("search")]
        [IgnoreAntiforgeryToken]
        [ProducesResponseType(typeof(PagedResultDto<CandidateSearchResultDto>), 200)]
        public async Task<ActionResult<PagedResultDto<CandidateSearchResultDto>>> SearchCandidatesAsync([FromBody] SearchCandidateInputDto input)
        {
            try
            {
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

                var result = await _candidateSearchAppService.SearchCandidatesAsync(input);
                return Ok(result);
            }
            catch (Volo.Abp.UserFriendlyException ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.Details });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tìm kiếm ứng viên", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy chi tiết một ứng viên
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CandidateSearchResultDto>> GetCandidateDetailAsync(Guid id)
        {
            try
            {
                var result = await _candidateSearchAppService.GetCandidateDetailAsync(id);
                return Ok(result);
            }
            catch (Volo.Abp.UserFriendlyException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải thông tin ứng viên", error = ex.Message });
            }
        }

        /// <summary>
        /// Gửi yêu cầu kết nối đến ứng viên
        /// </summary>
        [HttpPost("{id}/connection-requests")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> SendConnectionRequestAsync(Guid id, [FromBody] SendConnectionRequestDto input)
        {
            input.CandidateProfileId = id;
            await _candidateSearchAppService.SendConnectionRequestAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Re-index tất cả candidates vào Lucene
        /// </summary>
        [HttpPost("reindex")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> ReIndexAllCandidatesAsync()
        {
            try
            {
                await _candidateIndexService.ReIndexAllCandidatesAsync();
                return Ok(new { message = "Re-index thành công" });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi re-index", error = ex.Message });
            }
        }

        /// <summary>
        /// Index một candidate cụ thể
        /// </summary>
        [HttpPost("index/{userId}")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> IndexCandidateAsync(Guid userId)
        {
            try
            {
                await _candidateIndexService.IndexCandidateAsync(userId);
                return Ok(new { message = $"Đã index candidate {userId} thành công" });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi index candidate", error = ex.Message });
            }
        }
    }
}

