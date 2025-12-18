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
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace VCareer.Services.Auth.ActivityLog
{
    [Authorize]
    [RemoteService(IsEnabled = false)]
    public class ActivityLogAppService : ApplicationService, IActivityLogAppService
    {
        private const string SearchPlaceholder = "__ALL__";
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
            // Override validation: SearchKeyword is optional, set to null if empty
            if (string.IsNullOrWhiteSpace(input.SearchKeyword) || 
                string.Equals(input.SearchKeyword, SearchPlaceholder, StringComparison.Ordinal))
            {
                input.SearchKeyword = null;
            }

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

        public async Task<AllStaffActivityLogsListDto> GetMyActivityLogsAsync(ActivityLogFilterDto input)
        {
            // Override validation: SearchKeyword is optional
            if (string.IsNullOrWhiteSpace(input.SearchKeyword) ||
                string.Equals(input.SearchKeyword, SearchPlaceholder, StringComparison.Ordinal))
            {
                input.SearchKeyword = null;
            }

            // Step 1: Get current user profile
            var currentUserId = CurrentUser.Id.Value;
            var recruiterQueryable = await _recruiterRepository.GetQueryableAsync();
            var currentUserProfile = recruiterQueryable.FirstOrDefault(r => r.UserId == currentUserId);

            // Step 2: Validate current user is a recruiter
            if (currentUserProfile == null)
            {
                throw new BusinessException("Only recruiters can access activity logs");
            }

            // Step 3: Get activities queryable
            var queryable = await _activityLogRepository.GetQueryableAsync();

            // Filter by current user
            var query = queryable.Where(a => a.UserId == currentUserId);

            // Step 4: Apply filters
            query = ApplyFilters(query, input);

            // Step 5: Apply sorting
            if (!string.IsNullOrWhiteSpace(input.Sorting))
            {
                query = query.OrderBy(input.Sorting);
            }
            else
            {
                query = query.OrderByDescending(a => a.CreationTime);
            }

            // Step 6: Count total
            var totalCount = await AsyncExecuter.CountAsync(query);

            // Step 7: Apply paging
            var pagedQuery = query
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount);

            // Step 8: Execute query
            var activities = await AsyncExecuter.ToListAsync(pagedQuery);

            // Step 9: Get current user info
            var currentUser = await _userManager.GetByIdAsync(currentUserId);

            // Step 10: Map to DTOs
            var activityDtos = activities.Select(a => new ActivityLogWithStaffDto
            {
                Id = a.Id,
                UserId = a.UserId,
                StaffId = currentUserProfile.Id.ToString(),
                StaffName = $"{currentUser.Name} {currentUser.Surname}".Trim(),
                StaffEmail = currentUser.Email,
                ActivityType = a.ActivityType,
                ActivityTypeName = a.ActivityType.ToString(),
                Action = a.Action,
                Description = a.Description,
                CreationTime = a.CreationTime
            }).ToList();

            // Step 11: Build response
            var result = new AllStaffActivityLogsListDto
            {
                Activities = activityDtos,
                TotalCount = totalCount
            };

            return result;
        }

        public async Task<AllStaffActivityLogsListDto> GetAllStaffActivityLogsAsync(ActivityLogFilterDto input)
        {
            // Override validation: SearchKeyword is optional
            if (string.IsNullOrWhiteSpace(input.SearchKeyword) ||
                string.Equals(input.SearchKeyword, SearchPlaceholder, StringComparison.Ordinal))
            {
                input.SearchKeyword = null;
            }

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
                throw new BusinessException("Only team leaders can view all staff activity logs");
            }

            // Step 4: Get all staff in the same company
            var allStaff = recruiterQueryable
                .Where(r => r.CompanyId == currentUserProfile.CompanyId)
                .ToList();

            var staffUserIds = allStaff.Select(s => s.UserId).ToList();

            // Step 5: Get activities queryable
            var queryable = await _activityLogRepository.GetQueryableAsync();

            // Filter by all staff in the same company
            var query = queryable.Where(a => staffUserIds.Contains(a.UserId));

            // Step 6: Apply filters
            query = ApplyFilters(query, input);

            // Step 7: Apply sorting
            if (!string.IsNullOrWhiteSpace(input.Sorting))
            {
                query = query.OrderBy(input.Sorting);
            }
            else
            {
                query = query.OrderByDescending(a => a.CreationTime);
            }

            // Step 8: Count total
            var totalCount = await AsyncExecuter.CountAsync(query);

            // Step 9: Apply paging
            var pagedQuery = query
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount);

            // Step 10: Execute query
            var activities = await AsyncExecuter.ToListAsync(pagedQuery);

            // Step 11: Get user info for all staff
            var staffDict = allStaff.ToDictionary(s => s.UserId, s => s);
            var userIds = activities.Select(a => a.UserId).Distinct().ToList();
            var users = new Dictionary<Guid, IdentityUser>();
            foreach (var userId in userIds)
            {
                var user = await _userManager.GetByIdAsync(userId);
                users[userId] = user;
            }

            // Step 12: Map to DTOs
            var activityDtos = activities.Select(a =>
            {
                var staff = staffDict.ContainsKey(a.UserId) ? staffDict[a.UserId] : null;
                var user = users.ContainsKey(a.UserId) ? users[a.UserId] : null;

                return new ActivityLogWithStaffDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    StaffId = staff?.Id.ToString() ?? "",
                    StaffName = user != null ? $"{user.Name} {user.Surname}".Trim() : "",
                    StaffEmail = user?.Email ?? "",
                    ActivityType = a.ActivityType,
                    ActivityTypeName = a.ActivityType.ToString(),
                    Action = a.Action,
                    Description = a.Description,
                    CreationTime = a.CreationTime
                };
            }).ToList();

            // Step 13: Build response
            var result = new AllStaffActivityLogsListDto
            {
                Activities = activityDtos,
                TotalCount = totalCount
            };

            return result;
        }

        private IQueryable<Models.ActivityLogs.ActivityLog> ApplyFilters(
            IQueryable<Models.ActivityLogs.ActivityLog> query,
            ActivityLogFilterDto input)
        {
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

            return query;
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

            // Đảm bảo metadata không null (database không cho phép NULL)
            var safeMetadata = string.IsNullOrWhiteSpace(metadata) ? "{}" : metadata;

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
                safeMetadata
            );

            await _activityLogRepository.InsertAsync(activityLog);
        }
    }
}




