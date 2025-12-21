using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using VCareer.Controllers;
using VCareer.Dto.ActivityLogDto;
using VCareer.IServices.IActivityLogService;

namespace VCareer.HttpApi.Controllers
{
    [Route("api/app/activity-log")]
    [Authorize]
    public class ActivityLogController : VCareerController
    {
        private readonly IActivityLogAppService _activityLogAppService;

        public ActivityLogController(IActivityLogAppService activityLogAppService)
        {
            _activityLogAppService = activityLogAppService;
        }

        [HttpGet("my-activity-logs")]
        public async Task<AllStaffActivityLogsListDto> GetMyActivityLogsAsync([FromQuery] ActivityLogFilterDto input)
        {
            // Đảm bảo SearchKeyword không null nếu empty
            if (string.IsNullOrWhiteSpace(input.SearchKeyword))
            {
                input.SearchKeyword = null;
            }
            
            // Parse date strings to DateTime if provided
            ParseDateFilters(input);
            
            return await _activityLogAppService.GetMyActivityLogsAsync(input);
        }

        [HttpGet("all-staff-activity-logs")]
        public async Task<AllStaffActivityLogsListDto> GetAllStaffActivityLogsAsync([FromQuery] ActivityLogFilterDto input)
        {
            // Đảm bảo SearchKeyword không null nếu empty
            if (string.IsNullOrWhiteSpace(input.SearchKeyword))
            {
                input.SearchKeyword = null;
            }
            
            // Parse date strings to DateTime if provided
            ParseDateFilters(input);
            
            return await _activityLogAppService.GetAllStaffActivityLogsAsync(input);
        }
        
        private void ParseDateFilters(ActivityLogFilterDto input)
        {
            // ASP.NET Core model binding should automatically parse date strings
            // But we ensure dates are set correctly if they come as strings
            // This is mainly for debugging - model binding should handle it
        }

        [HttpGet("staff-activity-logs/{staffId}")]
        public async Task<ActivityLogListDto> GetStaffActivityLogsAsync(Guid staffId, [FromQuery] ActivityLogFilterDto input)
        {
            return await _activityLogAppService.GetStaffActivityLogsAsync(staffId, input);
        }
    }
}

