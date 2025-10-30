using System.Threading.Tasks;
using VCareer.Dto.CandidateCVDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.ICandidateCVService
{
    /// <summary>
    /// Service để Recruiter (Leader và HR Staff) xem CVs của candidates
    /// </summary>
    public interface ICandidateCVViewService : IApplicationService
    {
        /// <summary>
        /// Lấy danh sách CVs công khai của candidates
        /// Chỉ Leader Recruiter và HR Staff có quyền truy cập
        /// </summary>
        /// <param name="request">Filter và pagination parameters</param>
        /// <returns>Danh sách CVs với pagination info</returns>
        Task<ViewCandidateCVsResponseDto> GetPublicCVsAsync(ViewCandidateCVsRequestDto request);
        
        /// <summary>
        /// Lấy chi tiết một CV cụ thể
        /// </summary>
        /// <param name="cvId">ID của CV</param>
        /// <returns>Thông tin chi tiết CV</returns>
        Task<CandidateCVListDto> GetCVDetailAsync(System.Guid cvId);
    }
}

