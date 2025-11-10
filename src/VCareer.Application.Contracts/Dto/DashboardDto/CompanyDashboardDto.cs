using System;
using System.Collections.Generic;

namespace VCareer.Dto.DashboardDto
{
    /// <summary>
    /// DTO tổng hợp hiệu suất của toàn bộ công ty
    /// </summary>
    public class CompanyDashboardDto
    {
        public int CompanyId { get; set; }
        public string CompanyName { get; set; }
        
        // Overall Statistics
        public int TotalStaff { get; set; }
        public int ActiveStaff { get; set; }
        public int TotalLeaders { get; set; }
        
        // Aggregated Job Statistics
        public int TotalJobsPosted { get; set; }
        public int TotalActiveJobs { get; set; }
        public int TotalClosedJobs { get; set; }
        
        // Aggregated Candidate Statistics
        public int TotalCandidatesEvaluated { get; set; }
        public int TotalCandidatesApproved { get; set; }
        public int TotalCandidatesRejected { get; set; }
        
        // Aggregated Interview Statistics
        public int TotalInterviewsScheduled { get; set; }
        public int TotalInterviewsCompleted { get; set; }
        
        // Company Performance Metrics
        public decimal OverallApprovalRate { get; set; }
        public decimal OverallInterviewCompletionRate { get; set; }
        public decimal AverageActivitiesPerStaff { get; set; }
        
        // Time-based Statistics
        public int TodayActivities { get; set; }
        public int ThisWeekActivities { get; set; }
        public int ThisMonthActivities { get; set; }
        
        // Staff Performance List
        public List<StaffPerformanceDto> StaffPerformances { get; set; }
        
        // Top Performers
        public List<TopPerformerDto> TopPerformers { get; set; }
        
        public CompanyDashboardDto()
        {
            StaffPerformances = new List<StaffPerformanceDto>();
            TopPerformers = new List<TopPerformerDto>();
        }
    }
}








