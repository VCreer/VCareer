using System;
using System.Collections.Generic;

namespace VCareer.Dto.DashboardDto
{
    /// <summary>
    /// DTO chứa thông tin hiệu suất của một HR Staff
    /// </summary>
    public class StaffPerformanceDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public bool IsLead { get; set; }
        public bool Status { get; set; }
        
        // Job Statistics
        public int TotalJobsPosted { get; set; }
        public int ActiveJobs { get; set; }
        public int ClosedJobs { get; set; }
        public int DeletedJobs { get; set; }
        
        // Candidate Statistics
        public int TotalCandidatesEvaluated { get; set; }
        public int CandidatesApproved { get; set; }
        public int CandidatesRejected { get; set; }
        public int CandidatesShortlisted { get; set; }
        
        // Interview Statistics
        public int TotalInterviewsScheduled { get; set; }
        public int InterviewsCompleted { get; set; }
        public int InterviewsCancelled { get; set; }
        
        // Email Statistics
        public int TotalEmailsSent { get; set; }
        public int EmailTemplatesCreated { get; set; }
        
        // Application Statistics
        public int ApplicationsReviewed { get; set; }
        public int ApplicationsUpdated { get; set; }
        
        // Performance Metrics
        public decimal ApprovalRate { get; set; } // Tỷ lệ ứng viên được chấp thuận
        public decimal InterviewCompletionRate { get; set; } // Tỷ lệ hoàn thành phỏng vấn
        public decimal AverageActivitiesPerDay { get; set; } // Số hoạt động trung bình mỗi ngày
        
        // Time-based Statistics
        public int TodayActivities { get; set; }
        public int ThisWeekActivities { get; set; }
        public int ThisMonthActivities { get; set; }
        
        // Last Activity
        public DateTime? LastActivityDate { get; set; }
        public string LastActivityDescription { get; set; }
    }
}





































