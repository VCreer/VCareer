
export interface ActivityTrendDto {
  dailyTrend: DateActivityCountDto[];
  weeklyTrend: DateActivityCountDto[];
  monthlyTrend: DateActivityCountDto[];
}

export interface CompanyDashboardDto {
  companyId: number;
  companyName?: string;
  totalStaff: number;
  activeStaff: number;
  totalLeaders: number;
  totalJobsPosted: number;
  totalActiveJobs: number;
  totalClosedJobs: number;
  totalCandidatesEvaluated: number;
  totalCandidatesApproved: number;
  totalCandidatesRejected: number;
  totalInterviewsScheduled: number;
  totalInterviewsCompleted: number;
  overallApprovalRate: number;
  overallInterviewCompletionRate: number;
  averageActivitiesPerStaff: number;
  todayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  staffPerformances: StaffPerformanceDto[];
  topPerformers: TopPerformerDto[];
}

export interface DashboardFilterDto {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  includeInactive: boolean;
  sortBy?: string;
  descending: boolean;
}

export interface DateActivityCountDto {
  date?: string;
  count: number;
  label?: string;
}

export interface StaffPerformanceDto {
  userId?: string;
  fullName?: string;
  email?: string;
  isLead: boolean;
  status: boolean;
  totalJobsPosted: number;
  activeJobs: number;
  closedJobs: number;
  deletedJobs: number;
  totalCandidatesEvaluated: number;
  candidatesApproved: number;
  candidatesRejected: number;
  candidatesShortlisted: number;
  totalInterviewsScheduled: number;
  interviewsCompleted: number;
  interviewsCancelled: number;
  totalEmailsSent: number;
  emailTemplatesCreated: number;
  applicationsReviewed: number;
  applicationsUpdated: number;
  approvalRate: number;
  interviewCompletionRate: number;
  averageActivitiesPerDay: number;
  todayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  lastActivityDate?: string;
  lastActivityDescription?: string;
}

export interface TopPerformerDto {
  userId?: string;
  fullName?: string;
  email?: string;
  category?: string;
  value: number;
  description?: string;
}
