using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Job;
using VCareer.IServices.IJobServices;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers.Job
{
    /// <summary>
    /// API Controller cho quản lý danh mục nghề nghiệp
    /// </summary>
    [ApiController]
    [Route("api/job-categories")]
    public class JobCategoryController : AbpControllerBase
    {
        private readonly IJobCategoryAppService _jobCategoryService;

        public JobCategoryController(IJobCategoryAppService jobCategoryService)
        {
            _jobCategoryService = jobCategoryService;
        }

        /// <summary>
        /// Lấy cây phân cấp danh mục nghề nghiệp đầy đủ với số lượng job
        /// </summary>
        /// <returns>Danh sách category tree</returns>
        [HttpGet]
        [Route("tree")]
        public async Task<ActionResult<List<CategoryTreeDto>>> GetCategoryTreeAsync()
        {
            try
            {
                var categoryTree = await _jobCategoryService.GetCategoryTreeAsync();
                return Ok(categoryTree);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "lỗi mạng", error = ex.Message });
            }
        }

        /// <summary>
        /// Tìm kiếm danh mục nghề nghiệp theo từ khóa
        /// Trả về danh sách các leaf categories có path chứa từ khóa
        /// </summary>
        /// <param name="keyword">Từ khóa tìm kiếm</param>
        /// <returns>Danh sách category tree phù hợp</returns>
        [HttpGet]
        [Route("search")]
        public async Task<ActionResult<List<CategoryTreeDto>>> SearchCategoriesAsync([FromQuery] string keyword)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                {
                    return BadRequest(new { message = "Search keyword cannot be empty" });
                }

                var categories = await _jobCategoryService.SearchCategoriesAsync(keyword);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}



