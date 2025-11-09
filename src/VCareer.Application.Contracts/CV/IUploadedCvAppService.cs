using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.Application.Contracts.CV
{
    /// <summary>
    /// Interface cho Uploaded CV App Service
    /// </summary>
    public interface IUploadedCvAppService : IApplicationService
    {
        /// <summary>
        /// Upload CV file và tạo UploadedCv record
        /// </summary>
        Task<UploadedCvDto> UploadCvAsync(Microsoft.AspNetCore.Http.IFormFile file, string cvName, bool isDefault = false, bool isPublic = false, string? notes = null);

        /// <summary>
        /// Lấy danh sách Uploaded CVs của current user
        /// </summary>
        Task<PagedResultDto<UploadedCvDto>> GetListAsync(GetUploadedCvListDto input);

        /// <summary>
        /// Lấy Uploaded CV theo ID
        /// </summary>
        Task<UploadedCvDto> GetAsync(Guid id);

        /// <summary>
        /// Cập nhật Uploaded CV
        /// </summary>
        Task<UploadedCvDto> UpdateAsync(Guid id, UpdateUploadedCvDto input);

        /// <summary>
        /// Xóa Uploaded CV (soft delete)
        /// </summary>
        Task DeleteAsync(Guid id);

        /// <summary>
        /// Đặt CV làm mặc định
        /// </summary>
        Task SetDefaultAsync(Guid id);

        /// <summary>
        /// Download CV file
        /// </summary>
        Task<byte[]> DownloadCvAsync(Guid id);
    }
}


