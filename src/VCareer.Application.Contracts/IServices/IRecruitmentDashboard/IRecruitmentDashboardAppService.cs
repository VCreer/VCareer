using System;
using System.Threading.Tasks;
using VCareer.Dto.DashboardDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IRecruitmentDashboard
{
    /// <summary>
    /// Service để quản lý dashboard hiệu suất tuyển dụng cho Leader Recruiter
    /// Chỉ Leader Recruiter mới có quyền truy cập các API này
    /// </summary>
    public interface IRecruitmentDashboardAppService : IApplicationService
    {
        /// <summary>
        /// Lấy dashboard tổng quan của toàn công ty
        /// Hiển thị hiệu suất của tất cả HR Staff trong công ty
        /// </summary>
        /// <param name="filter">Bộ lọc để filter dữ liệu</param>
        /// <returns>Dashboard data của công ty</returns>
        Task<CompanyDashboardDto> GetCompanyDashboardAsync(DashboardFilterDto filter);
        
        /// <summary>
        /// Lấy hiệu suất chi tiết của một HR Staff cụ thể
        /// </summary>
        /// <param name="staffId">ID của HR Staff</param>
        /// <param name="filter">Bộ lọc theo khoảng thời gian</param>
        /// <returns>Hiệu suất chi tiết của staff</returns>
        Task<StaffPerformanceDto> GetStaffPerformanceAsync(Guid staffId, DashboardFilterDto filter);
        
        /// <summary>
        /// Lấy xu hướng hoạt động của công ty theo thời gian
        /// Dùng để hiển thị biểu đồ line chart
        /// </summary>
        /// <param name="filter">Bộ lọc theo khoảng thời gian</param>
        /// <returns>Dữ liệu xu hướng</returns>
        Task<ActivityTrendDto> GetActivityTrendAsync(DashboardFilterDto filter);
        
        /// <summary>
        /// Lấy danh sách top performers trong công ty
        /// </summary>
        /// <param name="topCount">Số lượng top performers</param>
        /// <param name="filter">Bộ lọc theo khoảng thời gian</param>
        /// <returns>Danh sách top performers</returns>
        Task<TopPerformerDto[]> GetTopPerformersAsync(int topCount, DashboardFilterDto filter);
        
        /// <summary>
        /// So sánh hiệu suất của nhiều HR Staff
        /// </summary>
        /// <param name="staffIds">Danh sách ID của các staff cần so sánh</param>
        /// <param name="filter">Bộ lọc theo khoảng thời gian</param>
        /// <returns>Danh sách hiệu suất của các staff</returns>
        Task<StaffPerformanceDto[]> CompareStaffPerformanceAsync(Guid[] staffIds, DashboardFilterDto filter);
    }
}




























