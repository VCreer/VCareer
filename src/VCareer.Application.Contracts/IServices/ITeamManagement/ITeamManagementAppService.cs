using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.TeamManagementDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.ITeamManagement
{
    /// <summary>
    /// Service để quản lý team (activate/deactivate staff)
    /// Chỉ Leader Recruiter mới có quyền truy cập
    /// </summary>
    public interface ITeamManagementAppService : IApplicationService
    {
        /// <summary>
        /// Lấy thông tin user hiện tại (DEBUG)
        /// </summary>
        /// <returns>Thông tin user</returns>
        Task<StaffListItemDto> GetCurrentUserInfoAsync();
        
        /// <summary>
        /// Lấy danh sách tất cả staff trong company
        /// Chỉ Leader trong cùng công ty mới có quyền
        /// </summary>
        /// <returns>Danh sách staff</returns>
        Task<List<StaffListItemDto>> GetAllStaffAsync();
        
        /// <summary>
        /// Vô hiệu hóa một HR Staff
        /// Chỉ Leader trong cùng công ty mới có quyền
        /// </summary>
        /// <param name="input">Thông tin deactivate</param>
        /// <returns>Kết quả thay đổi status</returns>
        Task<StaffStatusChangeDto> DeactivateStaffAsync(DeactivateStaffDto input);
        
        /// <summary>
        /// Kích hoạt lại một HR Staff
        /// Chỉ Leader trong cùng công ty mới có quyền
        /// </summary>
        /// <param name="input">Thông tin activate</param>
        /// <returns>Kết quả thay đổi status</returns>
        Task<StaffStatusChangeDto> ActivateStaffAsync(ActivateStaffDto input);
    }
}


