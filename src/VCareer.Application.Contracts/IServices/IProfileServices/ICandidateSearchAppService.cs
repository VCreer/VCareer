using System;
using System.Threading.Tasks;
using VCareer.Dto.Profile;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IProfileServices
{
    /// <summary>
    /// Service để tìm kiếm ứng viên cho recruiter
    /// </summary>
    public interface ICandidateSearchAppService : IApplicationService
    {
        /// <summary>
        /// Tìm kiếm ứng viên dựa trên các tiêu chí
        /// </summary>
        /// <param name="input">Thông tin tìm kiếm</param>
        /// <returns>Danh sách ứng viên phù hợp</returns>
        Task<PagedResultDto<CandidateSearchResultDto>> SearchCandidatesAsync(SearchCandidateInputDto input);

        /// <summary>
        /// Lấy thông tin chi tiết của một ứng viên
        /// </summary>
        /// <param name="candidateProfileId">ID của CandidateProfile</param>
        Task<CandidateSearchResultDto> GetCandidateDetailAsync(Guid candidateProfileId);

        /// <summary>
        /// Gửi yêu cầu kết nối đến ứng viên qua email
        /// </summary>
        Task SendConnectionRequestAsync(SendConnectionRequestDto input);
    }
}

