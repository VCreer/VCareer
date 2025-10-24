using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.CV
{
    /// <summary>
    /// Application Service interface cho CV Management
    /// </summary>
    public interface ICVAppService : IApplicationService
    {
        /// <summary>
        /// Tạo CV online
        /// </summary>
        /// <param name="input">Thông tin CV online</param>
        /// <returns>CV đã tạo</returns>
        Task<CVDto> CreateCVOnlineAsync(CreateCVOnlineDto input);

        /// <summary>
        /// Upload CV file
        /// </summary>
        /// <param name="input">Thông tin CV upload</param>
        /// <returns>CV đã upload</returns>
        Task<CVDto> UploadCVAsync(UploadCVDto input);

        /// <summary>
        /// Upload CV file đơn giản (chỉ cần file, không cần input fields)
        /// </summary>
        /// <param name="file">File CV</param>
        /// <returns>CV đã upload</returns>
        Task<CVDto> SimpleUploadCVAsync(IFormFile file);

        /// <summary>
        /// Update CV
        /// </summary>
        /// <param name="id">CV ID</param>
        /// <param name="input">Thông tin update</param>
        /// <returns>CV đã update</returns>
        Task<CVDto> UpdateCVAsync(Guid id, UpdateCVDto input);

        /// <summary>
        /// Get CV by ID
        /// </summary>
        /// <param name="id">CV ID</param>
        /// <returns>CV information</returns>
        Task<CVDto> GetCVAsync(Guid id);

        /// <summary>
        /// Get danh sách CV của current user
        /// </summary>
        /// <param name="input">Filter và pagination</param>
        /// <returns>Danh sách CV</returns>
        Task<PagedResultDto<CVDto>> GetCVListAsync(GetCVListDto input);

        /// <summary>
        /// Get CV mặc định của current user
        /// </summary>
        /// <returns>CV mặc định</returns>
        Task<CVDto> GetDefaultCVAsync();

        /// <summary>
        /// Set CV mặc định
        /// </summary>
        /// <param name="input">CV ID</param>
        /// <returns>Task</returns>
        Task SetDefaultCVAsync(SetDefaultCVDto input);

        /// <summary>
        /// Set CV public/private
        /// </summary>
        /// <param name="input">CV ID và trạng thái public</param>
        /// <returns>Task</returns>
        Task SetPublicCVAsync(SetPublicCVDto input);

        /// <summary>
        /// Delete CV
        /// </summary>
        /// <param name="id">CV ID</param>
        /// <returns>Task</returns>
        Task DeleteCVAsync(Guid id);

        /// <summary>
        /// Get CVs public của candidate (cho recruiter xem)
        /// </summary>
        /// <param name="candidateId">Candidate ID</param>
        /// <returns>Danh sách CV public</returns>
        Task<List<CVDto>> GetPublicCVsByCandidateAsync(Guid candidateId);
    }
}
