using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.DashboardDto;
using VCareer.IServices.IRecruitmentDashboard;
using VCareer.Models.ActivityLogs;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace VCareer.Services.RecruitmentDashboard
{
    /// <summary>
    /// Implementation của service dashboard hiệu suất tuyển dụng
    /// </summary>
    public class RecruitmentDashboardAppService : ApplicationService, IRecruitmentDashboardAppService
    {
        private readonly IRepository<ActivityLog, Guid> _activityLogRepository;
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly ICurrentUser _currentUser;

        public RecruitmentDashboardAppService(
            IRepository<ActivityLog, Guid> activityLogRepository,
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            IRepository<IdentityUser, Guid> userRepository,
            ICurrentUser currentUser)
        {
            _activityLogRepository = activityLogRepository;
            _recruiterProfileRepository = recruiterProfileRepository;
            _userRepository = userRepository;
            _currentUser = currentUser;
        }

        /// <summary>
        /// Lấy dashboard tổng quan của toàn công ty
        /// </summary>
        public async Task<CompanyDashboardDto> GetCompanyDashboardAsync(DashboardFilterDto filter)
        {
            // Kiểm tra quyền: Chỉ Leader Recruiter mới được truy cập
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Bạn không có quyền truy cập dashboard này. Chỉ Leader Recruiter mới có quyền.");
            }

            var companyId = currentRecruiter.CompanyId;

            // Lấy tất cả staff trong công ty
            var staffQuery = await _recruiterProfileRepository
                .WithDetailsAsync(r => r.User);

            var allStaff = staffQuery
                .Where(r => r.CompanyId == companyId)
                .Where(r => filter.IncludeInactive || r.Status)
                .ToList();

            if (filter.StaffId.HasValue)
            {
                allStaff = allStaff.Where(s => s.UserId == filter.StaffId.Value).ToList();
            }

            var staffIds = allStaff.Select(s => s.UserId).ToList();

            // Lấy activity logs của tất cả staff trong khoảng thời gian
            var activityQueryable = await _activityLogRepository.GetQueryableAsync();
            var activityQuery = activityQueryable
                .Where(a => staffIds.Contains(a.UserId));

            if (filter.StartDate.HasValue)
            {
                activityQuery = activityQuery.Where(a => a.CreationTime >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                activityQuery = activityQuery.Where(a => a.CreationTime <= filter.EndDate.Value);
            }

            var activities = await AsyncExecuter.ToListAsync(activityQuery);

            // Tính toán hiệu suất cho từng staff
            var staffPerformances = new List<StaffPerformanceDto>();
            foreach (var staff in allStaff)
            {
                var staffActivities = activities.Where(a => a.UserId == staff.UserId).ToList();
                var performance = CalculateStaffPerformance(staff, staffActivities, filter);
                staffPerformances.Add(performance);
            }

            // Sắp xếp theo yêu cầu
            staffPerformances = SortStaffPerformances(staffPerformances, filter.SortBy, filter.Descending);

            // Tính toán tổng quan công ty
            var dashboard = new CompanyDashboardDto
            {
                CompanyId = companyId,
                CompanyName = currentRecruiter.Company?.CompanyName ?? "Unknown",
                TotalStaff = allStaff.Count,
                ActiveStaff = allStaff.Count(s => s.Status),
                TotalLeaders = allStaff.Count(s => s.IsLead),
                
                // Aggregated Statistics
                TotalJobsPosted = staffPerformances.Sum(s => s.TotalJobsPosted),
                TotalActiveJobs = staffPerformances.Sum(s => s.ActiveJobs),
                TotalClosedJobs = staffPerformances.Sum(s => s.ClosedJobs),
                
                TotalCandidatesEvaluated = staffPerformances.Sum(s => s.TotalCandidatesEvaluated),
                TotalCandidatesApproved = staffPerformances.Sum(s => s.CandidatesApproved),
                TotalCandidatesRejected = staffPerformances.Sum(s => s.CandidatesRejected),
                
                TotalInterviewsScheduled = staffPerformances.Sum(s => s.TotalInterviewsScheduled),
                TotalInterviewsCompleted = staffPerformances.Sum(s => s.InterviewsCompleted),
                
                TodayActivities = staffPerformances.Sum(s => s.TodayActivities),
                ThisWeekActivities = staffPerformances.Sum(s => s.ThisWeekActivities),
                ThisMonthActivities = staffPerformances.Sum(s => s.ThisMonthActivities),
                
                StaffPerformances = staffPerformances
            };

            // Tính toán các metrics
            var totalEvaluations = dashboard.TotalCandidatesApproved + dashboard.TotalCandidatesRejected;
            dashboard.OverallApprovalRate = totalEvaluations > 0 
                ? (decimal)dashboard.TotalCandidatesApproved / totalEvaluations * 100 
                : 0;

            var totalInterviews = dashboard.TotalInterviewsCompleted + 
                                 staffPerformances.Sum(s => s.InterviewsCancelled);
            dashboard.OverallInterviewCompletionRate = totalInterviews > 0
                ? (decimal)dashboard.TotalInterviewsCompleted / totalInterviews * 100
                : 0;

            dashboard.AverageActivitiesPerStaff = dashboard.TotalStaff > 0
                ? (decimal)activities.Count / dashboard.TotalStaff
                : 0;

            // Tính toán top performers
            dashboard.TopPerformers = CalculateTopPerformers(staffPerformances);

            return dashboard;
        }

        /// <summary>
        /// Lấy hiệu suất chi tiết của một HR Staff cụ thể
        /// </summary>
        public async Task<StaffPerformanceDto> GetStaffPerformanceAsync(Guid staffId, DashboardFilterDto filter)
        {
            // Kiểm tra quyền
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Bạn không có quyền truy cập thông tin này.");
            }

            // Kiểm tra staff có cùng công ty không
            var staffQueryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User);
            var staffRecruiter = staffQueryable.FirstOrDefault(r => r.UserId == staffId);

            if (staffRecruiter == null)
            {
                throw new UserFriendlyException("Không tìm thấy HR Staff.");
            }

            if (staffRecruiter.CompanyId != currentRecruiter.CompanyId)
            {
                throw new UserFriendlyException("Bạn chỉ có thể xem thông tin của staff trong cùng công ty.");
            }

            // Lấy activity logs của staff
            var activityQueryable = await _activityLogRepository.GetQueryableAsync();
            var activityQuery = activityQueryable
                .Where(a => a.UserId == staffId);

            if (filter.StartDate.HasValue)
            {
                activityQuery = activityQuery.Where(a => a.CreationTime >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                activityQuery = activityQuery.Where(a => a.CreationTime <= filter.EndDate.Value);
            }

            var activities = await AsyncExecuter.ToListAsync(activityQuery);

            return CalculateStaffPerformance(staffRecruiter, activities, filter);
        }

        /// <summary>
        /// Lấy xu hướng hoạt động theo thời gian
        /// </summary>
        public async Task<ActivityTrendDto> GetActivityTrendAsync(DashboardFilterDto filter)
        {
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Bạn không có quyền truy cập thông tin này.");
            }

            var companyId = currentRecruiter.CompanyId;

            // Lấy tất cả staff trong công ty
            var staffQueryable = await _recruiterProfileRepository.GetQueryableAsync();
            var staffIds = await AsyncExecuter.ToListAsync(
                staffQueryable
                    .Where(r => r.CompanyId == companyId)
                    .Where(r => filter.IncludeInactive || r.Status)
                    .Select(r => r.UserId)
            );

            // Lấy activities
            var activityQueryable = await _activityLogRepository.GetQueryableAsync();
            var activityQuery = activityQueryable
                .Where(a => staffIds.Contains(a.UserId));

            if (filter.StartDate.HasValue)
            {
                activityQuery = activityQuery.Where(a => a.CreationTime >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                activityQuery = activityQuery.Where(a => a.CreationTime <= filter.EndDate.Value);
            }

            var activities = await AsyncExecuter.ToListAsync(activityQuery);

            var trend = new ActivityTrendDto();

            // Daily trend (last 30 days)
            var dailyGroups = activities
                .GroupBy(a => a.CreationTime.Date)
                .OrderBy(g => g.Key)
                .Select(g => new DateActivityCountDto
                {
                    Date = g.Key,
                    Count = g.Count(),
                    Label = g.Key.ToString("dd/MM/yyyy")
                })
                .ToList();
            trend.DailyTrend = dailyGroups;

            // Weekly trend
            var weeklyGroups = activities
                .GroupBy(a => GetWeekOfYear(a.CreationTime))
                .OrderBy(g => g.Key)
                .Select(g => new DateActivityCountDto
                {
                    Date = g.First().CreationTime.Date,
                    Count = g.Count(),
                    Label = $"Week {g.Key}"
                })
                .ToList();
            trend.WeeklyTrend = weeklyGroups;

            // Monthly trend
            var monthlyGroups = activities
                .GroupBy(a => new { a.CreationTime.Year, a.CreationTime.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new DateActivityCountDto
                {
                    Date = new DateTime(g.Key.Year, g.Key.Month, 1),
                    Count = g.Count(),
                    Label = $"{g.Key.Month}/{g.Key.Year}"
                })
                .ToList();
            trend.MonthlyTrend = monthlyGroups;

            return trend;
        }

        /// <summary>
        /// Lấy danh sách top performers
        /// </summary>
        public async Task<TopPerformerDto[]> GetTopPerformersAsync(int topCount, DashboardFilterDto filter)
        {
            var dashboard = await GetCompanyDashboardAsync(filter);
            return dashboard.TopPerformers.Take(topCount).ToArray();
        }

        /// <summary>
        /// So sánh hiệu suất của nhiều staff
        /// </summary>
        public async Task<StaffPerformanceDto[]> CompareStaffPerformanceAsync(Guid[] staffIds, DashboardFilterDto filter)
        {
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Bạn không có quyền truy cập thông tin này.");
            }

            var performances = new List<StaffPerformanceDto>();

            foreach (var staffId in staffIds)
            {
                try
                {
                    var performance = await GetStaffPerformanceAsync(staffId, filter);
                    performances.Add(performance);
                }
                catch (Exception)
                {
                    // Skip staff không hợp lệ
                    continue;
                }
            }

            return performances.ToArray();
        }

        #region Private Helper Methods

        /// <summary>
        /// Lấy thông tin RecruiterProfile của user hiện tại
        /// </summary>
        private async Task<RecruiterProfile> GetCurrentRecruiterProfileAsync()
        {
            if (!_currentUser.IsAuthenticated)
            {
                throw new UserFriendlyException("Bạn cần đăng nhập để truy cập.");
            }

            var currentUserId = _currentUser.Id.Value;
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User, r => r.Company);
            var recruiter = queryable.FirstOrDefault(r => r.UserId == currentUserId);

            if (recruiter == null)
            {
                throw new UserFriendlyException("Bạn không phải là Recruiter.");
            }

            return recruiter;
        }

        /// <summary>
        /// Tính toán hiệu suất của một staff
        /// </summary>
        private StaffPerformanceDto CalculateStaffPerformance(
            RecruiterProfile staff, 
            List<ActivityLog> activities,
            DashboardFilterDto filter)
        {
            var now = DateTime.Now;
            var today = now.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(now.Year, now.Month, 1);

            var performance = new StaffPerformanceDto
            {
                UserId = staff.UserId,
                FullName = $"{staff.User?.Name} {staff.User?.Surname}",
                Email = staff.User?.Email,
                IsLead = staff.IsLead,
                Status = staff.Status,

                // Job Statistics
                TotalJobsPosted = activities.Count(a => a.ActivityType == ActivityType.JobPosted),
                ActiveJobs = 0, // Cần thêm logic để track active jobs
                ClosedJobs = activities.Count(a => a.ActivityType == ActivityType.JobClosed),
                DeletedJobs = activities.Count(a => a.ActivityType == ActivityType.JobDeleted),

                // Candidate Statistics
                TotalCandidatesEvaluated = activities.Count(a => a.ActivityType == ActivityType.CandidateEvaluated),
                CandidatesApproved = activities.Count(a => a.ActivityType == ActivityType.CandidateApproved),
                CandidatesRejected = activities.Count(a => a.ActivityType == ActivityType.CandidateRejected),
                CandidatesShortlisted = activities.Count(a => a.ActivityType == ActivityType.CandidateShortlisted),

                // Interview Statistics
                TotalInterviewsScheduled = activities.Count(a => a.ActivityType == ActivityType.InterviewScheduled),
                InterviewsCompleted = activities.Count(a => a.ActivityType == ActivityType.InterviewCompleted),
                InterviewsCancelled = activities.Count(a => a.ActivityType == ActivityType.InterviewCancelled),

                // Email Statistics
                TotalEmailsSent = activities.Count(a => a.ActivityType == ActivityType.EmailSent),
                EmailTemplatesCreated = activities.Count(a => a.ActivityType == ActivityType.EmailTemplateCreated),

                // Application Statistics
                ApplicationsReviewed = activities.Count(a => a.ActivityType == ActivityType.ApplicationReviewed),
                ApplicationsUpdated = activities.Count(a => a.ActivityType == ActivityType.ApplicationUpdated),

                // Time-based Statistics
                TodayActivities = activities.Count(a => a.CreationTime >= today),
                ThisWeekActivities = activities.Count(a => a.CreationTime >= weekStart),
                ThisMonthActivities = activities.Count(a => a.CreationTime >= monthStart),
            };

            // Calculate Active Jobs (posted but not closed/deleted)
            var jobsPosted = activities.Where(a => a.ActivityType == ActivityType.JobPosted).ToList();
            var jobsClosed = activities.Where(a => a.ActivityType == ActivityType.JobClosed || a.ActivityType == ActivityType.JobDeleted).ToList();
            performance.ActiveJobs = jobsPosted.Count - jobsClosed.Count;
            if (performance.ActiveJobs < 0) performance.ActiveJobs = 0;

            // Performance Metrics
            var totalEvaluations = performance.CandidatesApproved + performance.CandidatesRejected;
            performance.ApprovalRate = totalEvaluations > 0
                ? (decimal)performance.CandidatesApproved / totalEvaluations * 100
                : 0;

            var totalInterviews = performance.InterviewsCompleted + performance.InterviewsCancelled;
            performance.InterviewCompletionRate = totalInterviews > 0
                ? (decimal)performance.InterviewsCompleted / totalInterviews * 100
                : 0;

            // Calculate average activities per day
            var dateRange = filter.EndDate.HasValue && filter.StartDate.HasValue
                ? (filter.EndDate.Value - filter.StartDate.Value).Days + 1
                : 30; // Default to 30 days
            performance.AverageActivitiesPerDay = dateRange > 0
                ? (decimal)activities.Count / dateRange
                : 0;

            // Last Activity
            var lastActivity = activities.OrderByDescending(a => a.CreationTime).FirstOrDefault();
            if (lastActivity != null)
            {
                performance.LastActivityDate = lastActivity.CreationTime;
                performance.LastActivityDescription = lastActivity.Description;
            }

            return performance;
        }

        /// <summary>
        /// Tính toán top performers
        /// </summary>
        private List<TopPerformerDto> CalculateTopPerformers(List<StaffPerformanceDto> staffPerformances)
        {
            var topPerformers = new List<TopPerformerDto>();

            // Top by Jobs Posted
            var topJobPoster = staffPerformances.OrderByDescending(s => s.TotalJobsPosted).FirstOrDefault();
            if (topJobPoster != null && topJobPoster.TotalJobsPosted > 0)
            {
                topPerformers.Add(new TopPerformerDto
                {
                    UserId = topJobPoster.UserId,
                    FullName = topJobPoster.FullName,
                    Email = topJobPoster.Email,
                    Category = "Most Jobs Posted",
                    Value = topJobPoster.TotalJobsPosted,
                    Description = $"Posted {topJobPoster.TotalJobsPosted} jobs"
                });
            }

            // Top by Candidates Approved
            var topApprover = staffPerformances.OrderByDescending(s => s.CandidatesApproved).FirstOrDefault();
            if (topApprover != null && topApprover.CandidatesApproved > 0)
            {
                topPerformers.Add(new TopPerformerDto
                {
                    UserId = topApprover.UserId,
                    FullName = topApprover.FullName,
                    Email = topApprover.Email,
                    Category = "Most Candidates Approved",
                    Value = topApprover.CandidatesApproved,
                    Description = $"Approved {topApprover.CandidatesApproved} candidates"
                });
            }

            // Top by Interviews Completed
            var topInterviewer = staffPerformances.OrderByDescending(s => s.InterviewsCompleted).FirstOrDefault();
            if (topInterviewer != null && topInterviewer.InterviewsCompleted > 0)
            {
                topPerformers.Add(new TopPerformerDto
                {
                    UserId = topInterviewer.UserId,
                    FullName = topInterviewer.FullName,
                    Email = topInterviewer.Email,
                    Category = "Most Interviews Completed",
                    Value = topInterviewer.InterviewsCompleted,
                    Description = $"Completed {topInterviewer.InterviewsCompleted} interviews"
                });
            }

            // Top by Approval Rate
            var topApprovalRate = staffPerformances
                .Where(s => s.CandidatesApproved + s.CandidatesRejected >= 5) // Minimum 5 evaluations
                .OrderByDescending(s => s.ApprovalRate)
                .FirstOrDefault();
            if (topApprovalRate != null)
            {
                topPerformers.Add(new TopPerformerDto
                {
                    UserId = topApprovalRate.UserId,
                    FullName = topApprovalRate.FullName,
                    Email = topApprovalRate.Email,
                    Category = "Highest Approval Rate",
                    Value = (int)topApprovalRate.ApprovalRate,
                    Description = $"{topApprovalRate.ApprovalRate:F1}% approval rate"
                });
            }

            // Top by Total Activities
            var topActive = staffPerformances.OrderByDescending(s => s.ThisMonthActivities).FirstOrDefault();
            if (topActive != null && topActive.ThisMonthActivities > 0)
            {
                topPerformers.Add(new TopPerformerDto
                {
                    UserId = topActive.UserId,
                    FullName = topActive.FullName,
                    Email = topActive.Email,
                    Category = "Most Active This Month",
                    Value = topActive.ThisMonthActivities,
                    Description = $"{topActive.ThisMonthActivities} activities this month"
                });
            }

            return topPerformers;
        }

        /// <summary>
        /// Sắp xếp danh sách staff theo tiêu chí
        /// </summary>
        private List<StaffPerformanceDto> SortStaffPerformances(
            List<StaffPerformanceDto> staffPerformances, 
            string sortBy, 
            bool descending)
        {
            var query = staffPerformances.AsQueryable();

            query = sortBy?.ToLower() switch
            {
                "fullname" => descending ? query.OrderByDescending(s => s.FullName) : query.OrderBy(s => s.FullName),
                "totalactivities" => descending ? query.OrderByDescending(s => s.ThisMonthActivities) : query.OrderBy(s => s.ThisMonthActivities),
                "approvalrate" => descending ? query.OrderByDescending(s => s.ApprovalRate) : query.OrderBy(s => s.ApprovalRate),
                "jobsposted" => descending ? query.OrderByDescending(s => s.TotalJobsPosted) : query.OrderBy(s => s.TotalJobsPosted),
                "candidatesapproved" => descending ? query.OrderByDescending(s => s.CandidatesApproved) : query.OrderBy(s => s.CandidatesApproved),
                "interviewscompleted" => descending ? query.OrderByDescending(s => s.InterviewsCompleted) : query.OrderBy(s => s.InterviewsCompleted),
                _ => query.OrderBy(s => s.FullName)
            };

            return query.ToList();
        }

        /// <summary>
        /// Lấy số tuần trong năm
        /// </summary>
        private int GetWeekOfYear(DateTime date)
        {
            var culture = System.Globalization.CultureInfo.CurrentCulture;
            var calendar = culture.Calendar;
            var weekRule = culture.DateTimeFormat.CalendarWeekRule;
            var firstDayOfWeek = culture.DateTimeFormat.FirstDayOfWeek;

            return calendar.GetWeekOfYear(date, weekRule, firstDayOfWeek);
        }

        #endregion
    }
}


