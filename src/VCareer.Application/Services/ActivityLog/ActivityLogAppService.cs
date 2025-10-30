using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using VCareer.Dto.ActivityLogDto;
using VCareer.IServices.IActivityLogService;
using VCareer.Models.ActivityLogs;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace VCareer.Services.ActivityLogService
{
    [Authorize]
    public class ActivityLogAppService : ApplicationService, IActivityLogAppService
    {
        private readonly IRepository<Models.ActivityLogs.ActivityLog, Guid> _activityLogRepository;
        private readonly IRepository<RecruiterProfile, Guid> _recruiterRepository;
        private readonly IdentityUserManager _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ActivityLogAppService(
            IRepository<Models.ActivityLogs.ActivityLog, Guid> activityLogRepository,
            IRepository<RecruiterProfile, Guid> recruiterRepository,
            IdentityUserManager userManager,
            IHttpContextAccessor httpContextAccessor)
        {
            _activityLogRepository = activityLogRepository;
            _recruiterRepository = recruiterRepository;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ActivityLogListDto> GetStaffActivityLogsAsync(Guid staffId, ActivityLogFilterDto input)
        {
            // Step 1: Get current user profile
            var currentUserId = CurrentUser.Id.Value;
            var recruiterQueryable = await _recruiterRepository.GetQueryableAsync();
            var currentUserProfile = recruiterQueryable.FirstOrDefault(r => r.UserId == currentUserId);

            // Step 2: Validate current user is a recruiter
            if (currentUserProfile == null)
            {
                throw new BusinessException("Only recruiters can access activity logs");
            }

            // Step 3: Validate current user is Team Leader
            if (!currentUserProfile.IsLead)
            {
                throw new BusinessException("Only team leaders can view staff activity logs");
            }

            // Step 4: Get staff member
            var staffMember = await _recruiterRepository.GetAsync(staffId);

            // Step 5: Validate same company
            if (currentUserProfile.CompanyId != staffMember.CompanyId)
            {
                throw new BusinessException("Cannot access activity logs from different company");
            }

            // Step 6: Get activities queryable
            var queryable = await _activityLogRepository.GetQueryableAsync();

            // Filter by user
            var query = queryable.Where(a => a.UserId == staffMember.UserId);

            // Step 7: Apply filters
            if (input.ActivityType.HasValue)
            {
                query = query.Where(a => a.ActivityType == input.ActivityType.Value);
            }

            if (input.StartDate.HasValue)
            {
                query = query.Where(a => a.CreationTime >= input.StartDate.Value);
            }

            if (input.EndDate.HasValue)
            {
                var endDate = input.EndDate.Value.AddDays(1); // Include the entire end date
                query = query.Where(a => a.CreationTime < endDate);
            }

            if (!string.IsNullOrWhiteSpace(input.SearchKeyword))
            {
                var keyword = input.SearchKeyword.ToLower();
                query = query.Where(a => 
                    a.Action.ToLower().Contains(keyword) || 
                    a.Description.ToLower().Contains(keyword));
            }

            // Step 8: Apply sorting
            if (!string.IsNullOrWhiteSpace(input.Sorting))
            {
                query = query.OrderBy(input.Sorting);
            }
            else
            {
                query = query.OrderByDescending(a => a.CreationTime);
            }

            // Step 10: Count total
            var totalCount = await AsyncExecuter.CountAsync(query);

            // Step 9: Apply paging
            var pagedQuery = query
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount);

            // Step 8: Execute query
            var activities = await AsyncExecuter.ToListAsync(pagedQuery);

            // Step 11: Get staff user info
            var staffUser = await _userManager.GetByIdAsync(staffMember.UserId);

            // Step 12: Map to DTOs
            var activityDtos = activities.Select(a => new ActivityLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                ActivityType = a.ActivityType,
                ActivityTypeName = a.ActivityType.ToString(),
                EntityId = a.EntityId,
                EntityType = a.EntityType,
                Action = a.Action,
                Description = a.Description,
                IpAddress = a.IpAddress,
                CreationTime = a.CreationTime,
                Metadata = string.IsNullOrWhiteSpace(a.Metadata) 
                    ? new Dictionary<string, object>() 
                    : JsonSerializer.Deserialize<Dictionary<string, object>>(a.Metadata)
            }).ToList();

            // Step 13: Calculate statistics
            var allActivitiesForStats = await AsyncExecuter.ToListAsync(
                (await _activityLogRepository.GetQueryableAsync())
                    .Where(a => a.UserId == staffMember.UserId)
            );

            var now = DateTime.UtcNow;
            var today = now.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(now.Year, now.Month, 1);

            var statistics = new ActivityStatisticsDto
            {
                TotalActivities = allActivitiesForStats.Count,
                JobActivities = allActivitiesForStats.Count(a => 
                    a.ActivityType >= ActivityType.JobPosted && 
                    a.ActivityType <= ActivityType.JobDeleted),
                EmailActivities = allActivitiesForStats.Count(a => 
                    a.ActivityType >= ActivityType.EmailSent && 
                    a.ActivityType <= ActivityType.EmailTemplateCreated),
                EvaluationActivities = allActivitiesForStats.Count(a => 
                    a.ActivityType >= ActivityType.CandidateEvaluated && 
                    a.ActivityType <= ActivityType.ApplicationUpdated),
                InterviewActivities = allActivitiesForStats.Count(a => 
                    a.ActivityType >= ActivityType.InterviewScheduled && 
                    a.ActivityType <= ActivityType.InterviewCancelled),
                TodayActivities = allActivitiesForStats.Count(a => a.CreationTime >= today),
                ThisWeekActivities = allActivitiesForStats.Count(a => a.CreationTime >= weekStart),
                ThisMonthActivities = allActivitiesForStats.Count(a => a.CreationTime >= monthStart)
            };

            // Step 14: Build response
            var result = new ActivityLogListDto
            {
                StaffInfo = new StaffInfoDto
                {
                    Id = staffMember.Id,
                    UserId = staffMember.UserId,
                    Email = staffUser.Email,
                    Name = staffUser.Name,
                    Surname = staffUser.Surname,
                    FullName = $"{staffUser.Name} {staffUser.Surname}".Trim(),
                    IsLead = staffMember.IsLead,
                    Status = staffMember.Status
                },
                Activities = activityDtos,
                Statistics = statistics,
                TotalCount = totalCount
            };

            return result;
        }

        public async Task LogActivityAsync(
            Guid userId,
            ActivityType activityType,
            string action,
            string description,
            Guid? entityId = null,
            string entityType = null,
            string metadata = null)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

            var activityLog = new Models.ActivityLogs.ActivityLog(
                GuidGenerator.Create(),
                userId,
                activityType,
                action,
                description,
                entityId,
                entityType,
                ipAddress,
                userAgent,
                metadata
            );

            await _activityLogRepository.InsertAsync(activityLog);
        }
    }
}




