using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.CV
{
    [ApiController]
    [Route("api/cv")]
    /*[Authorize]*/
    public class CVController : AbpControllerBase
    {
        private readonly ICVAppService _cvAppService;

        public CVController(ICVAppService cvAppService)
        {
            _cvAppService = cvAppService;
        }

        /// <summary>
        /// Tạo CV online
        /// </summary>
        /// <param name="input">Thông tin CV online</param>
        /// <returns>CV đã tạo</returns>
        [HttpPost("online")]
        /*[Authorize(VCareerPermission.CV.CreateOnline)]*/
        public async Task<CVDto> CreateCVOnlineAsync([FromBody] CreateCVOnlineDto input)
        {
            return await _cvAppService.CreateCVOnlineAsync(input);
        }

        /// <summary>
        /// Upload CV file
        /// </summary>
        /// <param name="input">Thông tin CV upload</param>
        /// <returns>CV đã upload</returns>
        [HttpPost("upload")]
        [Authorize(VCareerPermission.CV.Upload)]
        public async Task<CVDto> UploadCVAsync([FromBody] UploadCVDto input)
        {
            return await _cvAppService.UploadCVAsync(input);
        }

        /// <summary>
        /// Upload CV file đơn giản (chỉ cần file, không cần input fields)
        /// </summary>
        /// <param name="file">File CV</param>
        /// <returns>CV đã upload</returns>
        [HttpPost("simple-upload")]
        /*[Authorize(VCareerPermission.CV.Upload)]*/
        public async Task<CVDto> SimpleUploadCVAsync(IFormFile file)
        {
            return await _cvAppService.SimpleUploadCVAsync(file);
        }

        /// <summary>
        /// Update CV
        /// </summary>
        /// <param name="id">CV ID</param>
        /// <param name="input">Thông tin update</param>
        /// <returns>CV đã update</returns>
        [HttpPut("{id}")]
        [Authorize(VCareerPermission.CV.Update)]
        public async Task<CVDto> UpdateCVAsync(Guid id, [FromBody] UpdateCVDto input)
        {
            return await _cvAppService.UpdateCVAsync(id, input);
        }

        /// <summary>
        /// Get CV by ID
        /// </summary>
        /// <param name="id">CV ID</param>
        /// <returns>CV information</returns>
        [HttpGet("{id}")]
        /*[Authorize(VCareerPermission.CV.Get)]*/
        public async Task<CVDto> GetCVAsync(Guid id)
        {
            return await _cvAppService.GetCVAsync(id);
        }

        /// <summary>
        /// Get danh sách CV của current user theo loại
        /// </summary>
        /// <param name="cvType">Loại CV: Online hoặc Upload</param>
        /// <returns>Danh sách CV theo loại</returns>
        [HttpGet("by-type/{cvType}")]
        /*[Authorize(VCareerPermission.CV.Get)]*/
        public async Task<List<CVDto>> GetCVsByTypeAsync(string cvType)
        {
            var input = new GetCVListDto
            {
                CVType = cvType,
                MaxResultCount = 1000 // Get all CVs of this type
            };
            var result = await _cvAppService.GetCVListAsync(input);
            return result.Items.ToList();
        }

        /// <summary>
        /// Get danh sách CV của current user
        /// </summary>
        /// <param name="input">Filter và pagination</param>
        /// <returns>Danh sách CV</returns>
        [HttpGet]
        /*[Authorize(VCareerPermission.CV.Get)]*/
        public async Task<PagedResultDto<CVDto>> GetCVListAsync([FromQuery] GetCVListDto input)
        {
            return await _cvAppService.GetCVListAsync(input);
        }

        /// <summary>
        /// Get CV mặc định của current user
        /// </summary>
        /// <returns>CV mặc định</returns>
        [HttpGet("default")]
        [Authorize(VCareerPermission.CV.Get)]
        public async Task<CVDto> GetDefaultCVAsync()
        {
            return await _cvAppService.GetDefaultCVAsync();
        }

        /// <summary>
        /// Set CV mặc định
        /// </summary>
        /// <param name="input">CV ID</param>
        /// <returns>No content</returns>
        [HttpPut("set-default")]
        [Authorize(VCareerPermission.CV.SetDefault)]
        public async Task<IActionResult> SetDefaultCVAsync([FromBody] SetDefaultCVDto input)
        {
            await _cvAppService.SetDefaultCVAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Set CV public/private
        /// </summary>
        /// <param name="input">CV ID và trạng thái public</param>
        /// <returns>No content</returns>
        [HttpPut("set-public")]
        [Authorize(VCareerPermission.CV.SetPublic)]
        public async Task<IActionResult> SetPublicCVAsync([FromBody] SetPublicCVDto input)
        {
            await _cvAppService.SetPublicCVAsync(input);
            return NoContent();
        }

        /// <summary>
        /// Delete CV
        /// </summary>
        /// <param name="id">CV ID</param>
        /// <returns>No content</returns>
        [HttpDelete("{id}")]
        [Authorize(VCareerPermission.CV.Delete)]
        public async Task<IActionResult> DeleteCVAsync(Guid id)
        {
            await _cvAppService.DeleteCVAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Get CVs public của candidate (cho recruiter xem)
        /// </summary>
        /// <param name="candidateId">Candidate ID</param>
        /// <returns>Danh sách CV public</returns>
        [HttpGet("public/{candidateId}")]
        public async Task<List<CVDto>> GetPublicCVsByCandidateAsync(Guid candidateId)
        {
            return await _cvAppService.GetPublicCVsByCandidateAsync(candidateId);
        }
    }
}
