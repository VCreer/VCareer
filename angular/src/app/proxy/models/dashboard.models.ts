/**
 * Dashboard DTOs for Recruitment Performance Dashboard
 */

export interface StaffPerformanceDto {
  userId: string;
  fullName: string;
  email: string;
  isLead: boolean;
  status: boolean;
  
  // Job Statistics
  totalJobsPosted: number;
  activeJobs: number;
  closedJobs: number;
  deletedJobs: number;
  
  // Candidate Statistics
  totalCandidatesEvaluated: number;
  candidatesApproved: number;
  candidatesRejected: number;
  candidatesShortlisted: number;
  
  // Interview Statistics
  totalInterviewsScheduled: number;
  interviewsCompleted: number;
  interviewsCancelled: number;
  
  // Email Statistics
  totalEmailsSent: number;
  emailTemplatesCreated: number;
  
  // Application Statistics
  applicationsReviewed: number;
  applicationsUpdated: number;
  
  // Performance Metrics
  approvalRate: number;
  interviewCompletionRate: number;
  averageActivitiesPerDay: number;
  
  // Time-based Statistics
  todayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  
  // Last Activity
  lastActivityDate?: Date;
  lastActivityDescription?: string;
}

export interface CompanyDashboardDto {
  companyId: number;
  companyName: string;
  
  // Overall Statistics
  totalStaff: number;
  activeStaff: number;
  totalLeaders: number;
  
  // Aggregated Job Statistics
  totalJobsPosted: number;
  totalActiveJobs: number;
  totalClosedJobs: number;
  
  // Aggregated Candidate Statistics
  totalCandidatesEvaluated: number;
  totalCandidatesApproved: number;
  totalCandidatesRejected: number;
  
  // Aggregated Interview Statistics
  totalInterviewsScheduled: number;
  totalInterviewsCompleted: number;
  
  // Company Performance Metrics
  overallApprovalRate: number;
  overallInterviewCompletionRate: number;
  averageActivitiesPerStaff: number;
  
  // Time-based Statistics
  todayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  
  // Staff Performance List
  staffPerformances: StaffPerformanceDto[];
  
  // Top Performers
  topPerformers: TopPerformerDto[];
}

export interface TopPerformerDto {
  userId: string;
  fullName: string;
  email: string;
  category: string;
  value: number;
  description: string;
}

export interface DashboardFilterDto {
  startDate?: Date;
  endDate?: Date;
  staffId?: string;
  includeInactive?: boolean;
  sortBy?: string;
  descending?: boolean;
}

export interface ActivityTrendDto {
  dailyTrend: DateActivityCountDto[];
  weeklyTrend: DateActivityCountDto[];
  monthlyTrend: DateActivityCountDto[];
}

export interface DateActivityCountDto {
  date: Date;
  count: number;
  label: string;
}





