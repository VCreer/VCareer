using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.CV
{
    /// <summary>
    /// Application Service interface cho Candidate CV Management
    /// </summary>
    public interface ICandidateCvAppService : IApplicationService
    {
        /// <summary>
        /// Tạo mới CV từ template
        /// </summary>
        Task<CandidateCvDto> CreateAsync(CreateCandidateCvDto input);

        /// <summary>
        /// Cập nhật CV
        /// </summary>
        Task<CandidateCvDto> UpdateAsync(Guid id, UpdateCandidateCvDto input);

        /// <summary>
        /// Xóa CV
        /// </summary>
        Task DeleteAsync(Guid id);

        /// <summary>
        /// Lấy CV theo ID
        /// </summary>
        Task<CandidateCvDto> GetAsync(Guid id);

        /// <summary>
        /// Lấy danh sách CV của candidate hiện tại
        /// </summary>
        Task<PagedResultDto<CandidateCvDto>> GetListAsync(GetCandidateCvListDto input);

        /// <summary>
        /// Render CV thành HTML (áp dụng template và data)
        /// </summary>
        Task<RenderCvDto> RenderCvAsync(Guid cvId);

        /// <summary>
        /// Set CV làm mặc định
        /// </summary>
        Task SetDefaultAsync(Guid cvId);

        /// <summary>
        /// Publish/Unpublish CV
        /// </summary>
        Task PublishAsync(Guid cvId, bool isPublished);

        /// <summary>
        /// Tăng view count (khi recruiter xem CV)
        /// </summary>
        Task IncrementViewCountAsync(Guid cvId);

        /// <summary>
        /// Lấy CV mặc định của candidate hiện tại
        /// </summary>
        Task<CandidateCvDto> GetDefaultCvAsync();

        /// <summary>
        /// Cập nhật preview image của CV
        /// </summary>
        Task UpdatePreviewImageAsync(Guid cvId, string previewImageUrl);
    }
}

