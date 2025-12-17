using System;
using System.Threading.Tasks;
using VCareer.Dto.ActivityLogDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IActivityLogService
{
    public interface IActivityLogAppService : IApplicationService
    {
        /// <summary>
        /// Get activity logs for a specific HR Staff member
        /// Only accessible by Team Leader in the same company
        /// </summary>
        Task<ActivityLogListDto> GetStaffActivityLogsAsync(Guid staffId, ActivityLogFilterDto input);

        /// <summary>
        /// Get activity logs for current user (recruiter)
        /// </summary>
        Task<AllStaffActivityLogsListDto> GetMyActivityLogsAsync(ActivityLogFilterDto input);

        /// <summary>
        /// Get activity logs for all HR Staff in the same company
        /// Only accessible by Team Leader
        /// </summary>
        Task<AllStaffActivityLogsListDto> GetAllStaffActivityLogsAsync(ActivityLogFilterDto input);

        /// <summary>
        /// Log a new activity
        /// </summary>
        Task LogActivityAsync(
            Guid userId,
            Models.ActivityLogs.ActivityType activityType,
            string action,
            string description,
            Guid? entityId = null,
            string entityType = null,
            string metadata = null
        );
    }
}







































