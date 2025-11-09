using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.Job.JobPosting.ISerices;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers.Job
{
    /// <summary>
    /// API Controller cho Job Posting
    /// </summary>
    [ApiController]
    [Route("api/jobs")]
    public class JobPostingController : AbpControllerBase
    {
        private readonly IJobPostingAppService _jobPostingService;

        public JobPostingController(IJobPostingAppService jobPostingService)
        {
            _jobPostingService = jobPostingService;
        }



        //[HttpPut]
        //[Route("viewcount/{id}")]
        //public async Task<ActionResult> IncrementViewCountAsync(Guid id)
        //{
        //    await _jobPostingService.IncrementViewCountAsync(id);
        //    return Ok("tăng view thành công");
            
        //}



        #region Search & List
        //tim kiem
        [HttpPost]
        [Route("search")]
        public async Task<ActionResult<PagedResultDto<JobViewDto>>> SearchJobsAsync([FromBody] JobSearchInputDto input)
        {
            try
            {
                var result = await _jobPostingService.SearchJobsAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tìm kiếm jobs", error = ex.Message });
            }
        }

        #endregion

        #region Detail

        /// <summary>
        /// Lấy chi tiết job theo slug (cho SEO-friendly URL)
        /// </summary>
        /// <param name="slug">Job slug</param>
        /// <returns>Chi tiết job</returns>
        [HttpGet]
        [Route("slug/{slug}")]
        public async Task<ActionResult<JobViewDetail>> GetJobBySlugAsync(string slug)
        {
            try
            {
                var job = await _jobPostingService.GetJobBySlugAsync(slug);
                return Ok(job);
            }
            catch (Volo.Abp.BusinessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin job", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy chi tiết job theo ID
        /// </summary>
        /// <param name="id">Job ID</param>
        /// <returns>Chi tiết job</returns>
        [HttpGet]
        [Route("{id}")]
        public async Task<ActionResult<JobViewDetail>> GetJobByIdAsync(Guid id)
        {
            try
            {
                var job = await _jobPostingService.GetJobByIdAsync(id);
                return Ok(job);
            }
            catch (Volo.Abp.BusinessException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin job", error = ex.Message });
            }
        }

        #endregion

        #region Related Jobs

        /// <summary>
        /// Lấy danh sách job liên quan (cùng category, cùng location)
        /// </summary>
        /// <param name="id">Job ID</param>
        /// <param name="maxCount">Số lượng tối đa (default: 10)</param>
        /// <returns>Danh sách jobs liên quan</returns>
        [HttpGet]
        [Route("{id}/related")]
        public async Task<ActionResult<List<JobViewDto>>> GetRelatedJobsAsync(Guid id, [FromQuery] int maxCount = 10)
        {
            try
            {
                var relatedJobs = await _jobPostingService.GetRelatedJobsAsync(id, maxCount);
                return Ok(relatedJobs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy jobs liên quan", error = ex.Message });
            }
        }

        #endregion

        #region Indexing (Admin only)

        /// <summary>
        /// Reindex toàn bộ jobs (Admin only)
        /// ⚠️ Nên thêm [Authorize] với Admin role
        /// </summary>
        [HttpPost]
        [Route("reindex")]
        public async Task<ActionResult> ReindexAllJobsAsync()
        {
            try
            {
                await _jobPostingService.ReindexAllJobsAsync();
                return Ok(new { message = "Reindex thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi reindex jobs", error = ex.Message });
            }
        }

        /// <summary>
        /// Index 1 job cụ thể (khi create/update job)
        /// ⚠️ Nên thêm [Authorize] với Admin/Recruiter role
        /// </summary>
        /// <param name="id">Job ID</param>
        [HttpPost]
        [Route("{id}/index")]
        public async Task<ActionResult> IndexJobAsync(Guid id)
        {
            try
            {
                await _jobPostingService.IndexJobAsync(id);
                return Ok(new { message = "Index job thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi index job", error = ex.Message });
            }
        }

        /// <summary>
        /// Xóa job khỏi index (khi delete job)
        /// ⚠️ Nên thêm [Authorize] với Admin/Recruiter role
        /// </summary>
        /// <param name="id">Job ID</param>
        [HttpDelete]
        [Route("{id}/index")]
        public async Task<ActionResult> RemoveJobFromIndexAsync(Guid id)
        {
            try
            {
                await _jobPostingService.RemoveJobFromIndexAsync(id);
                return Ok(new { message = "Xóa job khỏi index thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa job khỏi index", error = ex.Message });
            }
        }

        #endregion

        #region Saved Jobs (Favorite)

        /// <summary>
        /// Lưu job vào danh sách yêu thích
        /// </summary>
        [HttpPost]
        [Route("{jobId}/save")]
        [Authorize]
        public async Task<ActionResult> SaveJobAsync(Guid jobId)
        {
            try
            {
                await _jobPostingService.SaveJobAsync(jobId);
                return Ok(new { message = "Đã lưu công việc thành công" });
            }
            catch (Volo.Abp.BusinessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lưu công việc", error = ex.Message });
            }
        }


        /// <summary>
        /// Bỏ lưu job khỏi danh sách yêu thích
        /// </summary>
        [HttpDelete]
        [Route("{jobId}/save")]
        [Authorize]
        public async Task<ActionResult> UnsaveJobAsync(Guid jobId)
        {
            try
            {
                await _jobPostingService.UnsaveJobAsync(jobId);
                return Ok(new { message = "Đã bỏ lưu công việc thành công" });
            }
            catch (Volo.Abp.BusinessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi bỏ lưu công việc", error = ex.Message });
            }
        }

        /// <summary>
        /// Kiểm tra xem job đã được lưu chưa
        /// </summary>
        [HttpGet]
        [Route("{jobId}/save-status")]
        public async Task<ActionResult<SavedJobStatusDto>> GetSavedJobStatusAsync(Guid jobId)
        {
            try
            {
                var status = await _jobPostingService.GetSavedJobStatusAsync(jobId);
                return Ok(status);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi kiểm tra trạng thái lưu", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách job đã lưu của user hiện tại
        /// </summary>
        [HttpGet]
        [Route("saved")]
        [Authorize]
        public async Task<ActionResult<PagedResultDto<SavedJobDto>>> GetSavedJobsAsync([FromQuery] int skipCount = 0, [FromQuery] int maxResultCount = 20)
        {
            try
            {
                var result = await _jobPostingService.GetSavedJobsAsync(skipCount, maxResultCount);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách công việc đã lưu", error = ex.Message });
            }
        }

        #endregion

        //#region Debug & Admin Tools

        ///// <summary>
        ///// 🔍 DEBUG: Test xem analyzer phân tách từ như thế nào
        ///// </summary>
        //[HttpGet("debug/tokenize")]
        //public async Task<ActionResult<List<string>>> TestTokenize([FromQuery] string text)
        //{
        //    try
        //    {
        //        var tokens = await _jobPostingService.TestTokenizeAsync(text);
        //        return Ok(new
        //        {
        //            input = text,
        //            tokens = tokens,
        //            count = tokens.Count
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        ///// <summary>
        ///// 🔄 Rebuild toàn bộ Lucene index
        ///// </summary>
        //[HttpPost("admin/rebuild-index")]
        //public async Task<ActionResult> RebuildIndex()
        //{
        //    try
        //    {
        //        await _jobPostingService.RebuildIndexAsync();
        //        return Ok(new { message = "✅ Rebuild index thành công!" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        ///// <summary>
        ///// 🗑️ Xóa toàn bộ Lucene index
        ///// </summary>
        //[HttpPost("admin/clear-index")]
        //public async Task<ActionResult> ClearIndex()
        //{
        //    try
        //    {
        //        await _jobPostingService.ClearIndexAsync();
        //        return Ok(new { message = "✅ Đã xóa index!" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        // #endregion



    }
}






