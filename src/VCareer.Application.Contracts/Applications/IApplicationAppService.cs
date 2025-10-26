using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using VCareer.Application.Contracts.Applications;

namespace VCareer.Application.Contracts.Applications
{
    /// <summary>
    /// Interface cho Application Management Service
    /// </summary>
    public interface IApplicationAppService
    {
        /// <summary>
        /// Nộp đơn ứng tuyển với CV từ thư viện
        /// </summary>
        Task<ApplicationDto> ApplyWithLibraryCVAsync(ApplyWithLibraryCVDto input);

        /// <summary>
        /// Nộp đơn ứng tuyển với CV tải lên mới
        /// </summary>
        Task<ApplicationDto> ApplyWithUploadCVAsync(ApplyWithUploadCVDto input);

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển
        /// </summary>
        Task<PagedResultDto<ApplicationDto>> GetApplicationListAsync(GetApplicationListDto input);

        /// <summary>
        /// Lấy thông tin chi tiết đơn ứng tuyển
        /// </summary>
        Task<ApplicationDto> GetApplicationAsync(Guid id);

        /// <summary>
        /// Cập nhật trạng thái đơn ứng tuyển (cho nhà tuyển dụng)
        /// </summary>
        Task<ApplicationDto> UpdateApplicationStatusAsync(Guid id, UpdateApplicationStatusDto input);

        /// <summary>
        /// Hủy đơn ứng tuyển (cho ứng viên)
        /// </summary>
        Task<ApplicationDto> WithdrawApplicationAsync(Guid id, WithdrawApplicationDto input);

        /// <summary>
        /// Đánh dấu đã xem đơn ứng tuyển
        /// </summary>
        Task<ApplicationDto> MarkAsViewedAsync(Guid id);

        /// <summary>
        /// Lấy thống kê đơn ứng tuyển
        /// </summary>
        Task<ApplicationStatisticsDto> GetApplicationStatisticsAsync(Guid? jobId = null, Guid? companyId = null);

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của ứng viên
        /// </summary>
        Task<PagedResultDto<ApplicationDto>> GetMyApplicationsAsync(GetApplicationListDto input);

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển của công ty
        /// </summary>
        Task<PagedResultDto<ApplicationDto>> GetCompanyApplicationsAsync(GetApplicationListDto input);

        /// <summary>
        /// Lấy danh sách đơn ứng tuyển cho một công việc cụ thể
        /// </summary>
        Task<PagedResultDto<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, GetApplicationListDto input);

        /// <summary>
        /// Tải xuống CV của đơn ứng tuyển
        /// </summary>
        Task<byte[]> DownloadApplicationCVAsync(Guid id);

        /// <summary>
        /// Xóa đơn ứng tuyển (soft delete)
        /// </summary>
        Task DeleteApplicationAsync(Guid id);
    }
}

