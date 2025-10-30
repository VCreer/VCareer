import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruitmentDashboardService } from '../../../proxy/api/recruitment-dashboard.service';
import {
  CompanyDashboardDto,
  StaffPerformanceDto,
  ActivityTrendDto,
  TopPerformerDto,
  DashboardFilterDto
} from '../../../proxy/models/dashboard.models';

@Component({
  selector: 'app-recruitment-performance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruitment-performance-dashboard.component.html',
  styleUrls: ['./recruitment-performance-dashboard.component.scss']
})
export class RecruitmentPerformanceDashboardComponent implements OnInit {
  companyDashboard: CompanyDashboardDto | null = null;
  activityTrend: ActivityTrendDto | null = null;
  loading = false;
  error: string | null = null;

  // Filter options
  filter: DashboardFilterDto = {
    startDate: this.getDefaultStartDate(),
    endDate: new Date(),
    includeInactive: false,
    sortBy: 'ThisMonthActivities',
    descending: true
  };

  // View options
  viewMode: 'overview' | 'staff-list' | 'trends' | 'comparison' = 'overview';
  selectedStaffIds: string[] = [];
  
  // Sorting options
  sortOptions = [
    { value: 'FullName', label: 'Name' },
    { value: 'ThisMonthActivities', label: 'Total Activities' },
    { value: 'ApprovalRate', label: 'Approval Rate' },
    { value: 'TotalJobsPosted', label: 'Jobs Posted' },
    { value: 'CandidatesApproved', label: 'Candidates Approved' },
    { value: 'InterviewsCompleted', label: 'Interviews Completed' }
  ];

  constructor(private dashboardService: RecruitmentDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadActivityTrend();
  }

  /**
   * Load company dashboard data
   */
  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getCompanyDashboard(this.filter).subscribe({
      next: (data) => {
        this.companyDashboard = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error?.message || 'Failed to load dashboard data';
        this.loading = false;
        console.error('Dashboard error:', err);
      }
    });
  }

  /**
   * Load activity trend data
   */
  loadActivityTrend(): void {
    this.dashboardService.getActivityTrend(this.filter).subscribe({
      next: (data) => {
        this.activityTrend = data;
      },
      error: (err) => {
        console.error('Trend error:', err);
      }
    });
  }

  /**
   * Apply filters and reload dashboard
   */
  applyFilters(): void {
    this.loadDashboard();
    this.loadActivityTrend();
  }

  /**
   * Reset filters to default
   */
  resetFilters(): void {
    this.filter = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date(),
      includeInactive: false,
      sortBy: 'ThisMonthActivities',
      descending: true
    };
    this.applyFilters();
  }

  /**
   * Get default start date (30 days ago)
   */
  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }

  /**
   * Toggle staff selection for comparison
   */
  toggleStaffSelection(staffId: string): void {
    const index = this.selectedStaffIds.indexOf(staffId);
    if (index > -1) {
      this.selectedStaffIds.splice(index, 1);
    } else {
      this.selectedStaffIds.push(staffId);
    }
  }

  /**
   * Check if staff is selected
   */
  isStaffSelected(staffId: string): boolean {
    return this.selectedStaffIds.includes(staffId);
  }

  /**
   * Get selected staff performances
   */
  getSelectedStaffPerformances(): StaffPerformanceDto[] {
    if (!this.companyDashboard) return [];
    return this.companyDashboard.staffPerformances.filter(s => 
      this.selectedStaffIds.includes(s.userId)
    );
  }

  /**
   * Change view mode
   */
  setViewMode(mode: 'overview' | 'staff-list' | 'trends' | 'comparison'): void {
    this.viewMode = mode;
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * Format percentage
   */
  formatPercentage(num: number): string {
    return num.toFixed(1) + '%';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: boolean): string {
    return status ? 'badge-active' : 'badge-inactive';
  }

  /**
   * Get status text
   */
  getStatusText(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  /**
   * Export dashboard data to CSV
   */
  exportToCSV(): void {
    if (!this.companyDashboard) return;

    const headers = [
      'Full Name',
      'Email',
      'Status',
      'Total Jobs Posted',
      'Active Jobs',
      'Candidates Evaluated',
      'Candidates Approved',
      'Candidates Rejected',
      'Approval Rate',
      'Interviews Scheduled',
      'Interviews Completed',
      'Interview Completion Rate',
      'This Month Activities'
    ];

    const rows = this.companyDashboard.staffPerformances.map(staff => [
      staff.fullName,
      staff.email,
      this.getStatusText(staff.status),
      staff.totalJobsPosted,
      staff.activeJobs,
      staff.totalCandidatesEvaluated,
      staff.candidatesApproved,
      staff.candidatesRejected,
      this.formatPercentage(staff.approvalRate),
      staff.totalInterviewsScheduled,
      staff.interviewsCompleted,
      this.formatPercentage(staff.interviewCompletionRate),
      staff.thisMonthActivities
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recruitment-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get performance indicator color
   */
  getPerformanceColor(value: number, threshold: number = 50): string {
    if (value >= threshold * 1.5) return 'text-success';
    if (value >= threshold) return 'text-warning';
    return 'text-danger';
  }

  /**
   * Get activity trend for chart (last 7 days)
   */
  getLast7DaysTrend(): any[] {
    if (!this.activityTrend || !this.activityTrend.dailyTrend) return [];
    return this.activityTrend.dailyTrend.slice(-7);
  }
}





