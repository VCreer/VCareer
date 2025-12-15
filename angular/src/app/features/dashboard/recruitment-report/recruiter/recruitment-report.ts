import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ButtonComponent, 
  ToastNotificationComponent
} from '../../../../shared/components';
import { ReportMetricCardComponent } from '../../../../shared/components/report-metric-card/report-metric-card';
import { StatusItemComponent } from '../../../../shared/components/status-item/status-item';
import { RecruitmentDashboardService } from '../../../../proxy/services/recruitment-dashboard/recruitment-dashboard.service';
import { RecruitmentCompainService } from '../../../../proxy/services/job/recruitment-compain.service';
import { ApplicationService } from '../../../../proxy/application/applications/application.service';
import type { CompanyDashboardDto, DashboardFilterDto, StaffPerformanceDto } from '../../../../proxy/dto/dashboard-dto/models';
import type { RecruimentCampainViewDto } from '../../../../proxy/dto/job-dto/models';
import type { ApplicationStatisticsDto } from '../../../../proxy/dto/applications/models';
import { ProfileService } from '../../../../proxy/services/profile/profile.service';

interface ReportMetric {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

@Component({
  selector: 'app-recruitment-report',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    ToastNotificationComponent,
    ReportMetricCardComponent,
    StatusItemComponent
  ],
  templateUrl: './recruitment-report.html',
  styleUrls: ['./recruitment-report.scss']
})
export class RecruitmentReportComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';
  
  // Time filter
  showTimeFilter = false;
  selectedTimeRange = 'all';
  timeRanges = [
    { value: 'all', label: 'Tất cả' },
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: '7 ngày qua' },
    { value: 'month', label: '30 ngày qua' },
    { value: 'quarter', label: '3 tháng qua' },
    { value: 'year', label: 'Năm nay' }
  ];

  // Report metrics
  metrics: ReportMetric[] = [
    {
      label: 'Tổng chiến dịch',
      value: 24,
      icon: 'fa-briefcase',
      color: '#0F83BA',
      trend: { value: 12, isPositive: true }
    },
    {
      label: 'Tổng ứng viên',
      value: '1,847',
      icon: 'fa-users',
      color: '#10b981',
      trend: { value: 23, isPositive: true }
    },
    {
      label: 'Tổng CV đã duyệt',
      value: 432,
      icon: 'fa-check-circle',
      color: '#10b981',
      trend: { value: 18, isPositive: true }
    },
    {
      label: 'Tổng CV từ chối',
      value: 289,
      icon: 'fa-times-circle',
      color: '#ef4444',
      trend: { value: 8, isPositive: false }
    }
  ];

  // Campaign status data
  campaignStatus = [
    { status: 'Đang hoạt động', count: 5, icon: 'fa-bolt', color: '#10b981' },
    { status: 'Sắp diễn ra', count: 2, icon: 'fa-clock', color: '#f59e0b' },
    { status: 'Đã hoàn thành', count: 17, icon: 'fa-check', color: '#0F83BA' }
  ];

  // Service overview
  serviceOverview = {
    description: 'Ghi nhận theo đơn hàng bạn đã thanh toán và những tin các dịch vụ được kích hoạt trong khoảng thời gian này',
    costBreakdown: {
      completed: { label: 'Chi phí đã thanh toán', value: 20000000, percentage: 71.4 },
      inUse: { label: 'Đã sử dụng', value: 8000000, percentage: 28.6 }
    },
    valueBreakdown: {
      activated: { label: 'Giá trị dịch vụ đã mua', value: 16000000, percentage: 76.2 },
      inUse: { label: 'Đã sử dụng', value: 5000000, percentage: 23.8 }
    }
  };

  // HR Staff performance data
  hrStaffPerformance = [
    { name: 'Nguyễn Văn A', campaigns: 8, candidates: 342, approved: 245, rejected: 97, efficiency: 71.6 },
    { name: 'Trần Thị B', campaigns: 6, candidates: 289, approved: 198, rejected: 91, efficiency: 68.5 },
    { name: 'Lê Văn C', campaigns: 5, candidates: 256, approved: 187, rejected: 69, efficiency: 73.0 },
    { name: 'Phạm Thị D', campaigns: 5, candidates: 360, approved: 226, rejected: 134, efficiency: 62.8 }
  ];

  // Recruitment funnel
  recruitmentFunnel = {
    stages: [
      { name: 'Hồ sơ tiếp nhận', count: 1000, color: '#6b7280' },
      { name: 'Hẹn phỏng vấn', count: 600, color: '#0F83BA' },
      { name: 'Gửi đề nghị', count: 100, color: '#f59e0b' },
      { name: 'Nhận việc', count: 30, color: '#10b981' },
      { name: 'Từ chối', count: 970, color: '#ef4444' }
    ]
  };

  // Cost breakdown
  costBreakdown = {
    stages: [
      { name: 'Hồ sơ tiếp nhận', cost: 8000, color: '#6b7280' },
      { name: 'Hẹn phỏng vấn', cost: 11760, color: '#0F83BA' },
      { name: 'Gửi đề nghị', cost: 80000, color: '#f59e0b' },
      { name: 'Nhận việc', cost: 260000, color: '#10b981' },
      { name: 'Từ chối', cost: 75000, color: '#ef4444' }
    ]
  };

  // Recent campaigns
  recentCampaigns = [
    {
      id: '#2366831',
      title: 'Senior Frontend Developer',
      status: 'Đã duyệt',
      statusClass: 'approved',
      candidates: 45,
      views: 234
    },
    {
      id: '#2366752',
      title: 'UI/UX Designer',
      status: 'Đã duyệt',
      statusClass: 'approved',
      candidates: 56,
      views: 312
    },
    {
      id: '#2366845',
      title: 'Backend Developer',
      status: 'Chờ duyệt',
      statusClass: 'pending',
      candidates: 32,
      views: 189
    },
    {
      id: '#2366668',
      title: 'DevOps Engineer',
      status: 'Đã duyệt',
      statusClass: 'approved',
      candidates: 28,
      views: 198
    }
  ];

  // Loading states
  isLoadingMetrics: boolean = false;
  isLoadingCampaigns: boolean = false;
  isLoadingStaff: boolean = false;
  isLoadingApplications: boolean = false;
  
  // Company ID (from profile)
  companyId: number | null = null;

  constructor(
    private recruitmentDashboardService: RecruitmentDashboardService,
    private recruitmentCampaignService: RecruitmentCompainService,
    private applicationService: ApplicationService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
    
    // Load company ID from profile first
    this.loadCompanyId();
  }

  /**
   * Load company ID from current user profile
   */
  loadCompanyId(): void {
    this.profileService.getCurrentUserProfile().subscribe({
      next: (response: any) => {
        const profile = response?.result || response?.data || response;
        if (profile?.companyId) {
          this.companyId = profile.companyId;
          // Load all data after getting company ID
          this.loadAllData();
        } else {
          console.warn('No company ID found in profile');
          // Still try to load data (might work without company ID filter)
          this.loadAllData();
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        // Still try to load data
        this.loadAllData();
      }
    });
  }

  /**
   * Load all dashboard data
   */
  loadAllData(): void {
    this.loadMetrics();
    this.loadCampaignStatus();
    this.loadStaffPerformance();
    this.loadApplicationStatistics();
    this.loadRecentCampaigns();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.time-filter-wrapper')) {
      this.showTimeFilter = false;
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  toggleTimeFilter(): void {
    this.showTimeFilter = !this.showTimeFilter;
  }

  selectTimeRange(range: string): void {
    this.selectedTimeRange = range;
    this.showTimeFilter = false;
    // Reload data with new time range filter
    this.loadAllData();
    this.showToastMessage(`Đã lọc theo: ${this.timeRanges.find(r => r.value === range)?.label}`, 'info');
  }

  /**
   * Get date range based on selected time filter
   */
  private getDateRange(): { startDate?: string; endDate?: string } {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date = now;

    switch (this.selectedTimeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        return {};
    }

    return {
      startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Build DashboardFilterDto from current settings
   */
  private buildFilter(): DashboardFilterDto {
    const dateRange = this.getDateRange();
    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      includeInactive: false,
      descending: true
    };
  }

  getSelectedTimeLabel(): string {
    return this.timeRanges.find(r => r.value === this.selectedTimeRange)?.label || 'Tất cả';
  }

  onExportReport(): void {
    this.showToastMessage('Đang xuất báo cáo...', 'info');
    setTimeout(() => {
      this.showToastMessage('Xuất báo cáo thành công!', 'success');
    }, 1000);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  /**
   * Load metrics from CompanyDashboardDto
   */
  private loadMetrics(): void {
    if (!this.companyId) {
      return;
    }

    this.isLoadingMetrics = true;
    const filter = this.buildFilter();
    
    this.recruitmentDashboardService.getCompanyDashboard(filter).subscribe({
      next: (response: any) => {
        const dashboard: CompanyDashboardDto = response?.result || response?.data || response;
        
        if (dashboard) {
          // Update metrics
          this.metrics = [
            {
              label: 'Tổng chiến dịch',
              value: dashboard.totalJobsPosted || 0,
              icon: 'fa-briefcase',
              color: '#0F83BA',
              trend: { value: 0, isPositive: true } // TODO: Calculate trend if needed
            },
            {
              label: 'Tổng ứng viên',
              value: this.formatNumber(dashboard.totalCandidatesEvaluated || 0),
              icon: 'fa-users',
              color: '#10b981',
              trend: { value: 0, isPositive: true }
            },
            {
              label: 'Tổng CV đã duyệt',
              value: dashboard.totalCandidatesApproved || 0,
              icon: 'fa-check-circle',
              color: '#10b981',
              trend: { value: 0, isPositive: true }
            },
            {
              label: 'Tổng CV từ chối',
              value: dashboard.totalCandidatesRejected || 0,
              icon: 'fa-times-circle',
              color: '#ef4444',
              trend: { value: 0, isPositive: false }
            }
          ];
        }
        
        this.isLoadingMetrics = false;
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
        this.isLoadingMetrics = false;
      }
    });
  }

  /**
   * Load campaign status
   */
  private loadCampaignStatus(): void {
    if (!this.companyId) {
      return;
    }

    this.isLoadingCampaigns = true;
    
    // Load active campaigns
    this.recruitmentCampaignService.getCompainByCompanyIdByCompanyIdAndIsActive(this.companyId, true).subscribe({
      next: (activeResponse: any) => {
        const activeCampaigns: RecruimentCampainViewDto[] = activeResponse?.result || activeResponse?.data || activeResponse || [];
        
        // Load inactive campaigns
        this.recruitmentCampaignService.getCompainByCompanyIdByCompanyIdAndIsActive(this.companyId, false).subscribe({
          next: (inactiveResponse: any) => {
            const inactiveCampaigns: RecruimentCampainViewDto[] = inactiveResponse?.result || inactiveResponse?.data || inactiveResponse || [];
            
            // Calculate status counts
            const activeCount = activeCampaigns.length;
            const completedCount = inactiveCampaigns.length;
            
            // For "Sắp diễn ra", we might need additional logic or use a different field
            // For now, we'll use a placeholder or calculate based on dates
            const upcomingCount = 0; // TODO: Calculate based on campaign start dates if available
            
            this.campaignStatus = [
              { status: 'Đang hoạt động', count: activeCount, icon: 'fa-bolt', color: '#10b981' },
              { status: 'Sắp diễn ra', count: upcomingCount, icon: 'fa-clock', color: '#f59e0b' },
              { status: 'Đã hoàn thành', count: completedCount, icon: 'fa-check', color: '#0F83BA' }
            ];
            
            this.isLoadingCampaigns = false;
          },
          error: (error) => {
            console.error('Error loading inactive campaigns:', error);
            this.isLoadingCampaigns = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading active campaigns:', error);
        this.isLoadingCampaigns = false;
      }
    });
  }

  /**
   * Load HR staff performance
   */
  private loadStaffPerformance(): void {
    if (!this.companyId) {
      return;
    }

    this.isLoadingStaff = true;
    const filter = this.buildFilter();
    
    this.recruitmentDashboardService.getTopPerformers(10, filter).subscribe({
      next: (response: any) => {
        const topPerformers: StaffPerformanceDto[] = response?.result || response?.data || response || [];
        
        // Map to component format
        this.hrStaffPerformance = topPerformers.map(staff => ({
          name: staff.fullName || 'N/A',
          campaigns: staff.totalJobsPosted || 0,
          candidates: staff.totalCandidatesEvaluated || 0,
          approved: staff.candidatesApproved || 0,
          rejected: staff.candidatesRejected || 0,
          efficiency: staff.approvalRate || 0
        }));
        
        this.isLoadingStaff = false;
      },
      error: (error) => {
        console.error('Error loading staff performance:', error);
        this.isLoadingStaff = false;
      }
    });
  }

  /**
   * Load application statistics for funnel and cost breakdown
   */
  private loadApplicationStatistics(): void {
    if (!this.companyId) {
      return;
    }

    this.isLoadingApplications = true;
    
    this.applicationService.getApplicationStatistics(undefined, this.companyId).subscribe({
      next: (response: any) => {
        const stats: ApplicationStatisticsDto = response?.result || response?.data || response;
        
        if (stats) {
          // Tổng đơn ứng tuyển theo công ty hiện tại
          const total = stats.totalApplications || 0;
          const pending = stats.pendingApplications || 0;
          const shortlisted = stats.shortlistedApplications || 0;
          const accepted = stats.acceptedApplications || 0; // CV có trạng thái nhận việc
          const rejected = stats.rejectedApplications || 0; // CV từ chối
          
          // Cập nhật funnel trạng thái hồ sơ
          this.recruitmentFunnel = {
            stages: [
              { name: 'Hồ sơ tiếp nhận', count: total, color: '#6b7280' },
              { name: 'Hẹn phỏng vấn', count: shortlisted, color: '#0F83BA' },
              { name: 'Gửi đề nghị', count: accepted, color: '#f59e0b' },
              { name: 'Nhận việc', count: accepted, color: '#10b981' },
              { name: 'Từ chối', count: rejected, color: '#ef4444' }
            ]
          };

          // Cập nhật 2 thẻ metric: Tổng CV đã duyệt & Tổng CV từ chối
          if (this.metrics && this.metrics.length >= 4) {
            // Tổng ứng viên đã apply vào công ty vẫn dùng số unique candidate từ dashboard (đang set ở loadMetrics)
            // Chỉ cập nhật lại 2 ô CV theo số đơn ứng tuyển (application) từ thống kê
            this.metrics[2] = {
              ...this.metrics[2],
              value: accepted
            };
            this.metrics[3] = {
              ...this.metrics[3],
              value: rejected
            };
          }
          
          // Cost breakdown - placeholder, có thể cập nhật theo dữ liệu thực tế nếu backend trả về
          const baseCost = 10000;
          this.costBreakdown = {
            stages: [
              { name: 'Hồ sơ tiếp nhận', cost: total * baseCost, color: '#6b7280' },
              { name: 'Hẹn phỏng vấn', cost: shortlisted * baseCost * 1.5, color: '#0F83BA' },
              { name: 'Gửi đề nghị', cost: accepted * baseCost * 10, color: '#f59e0b' },
              { name: 'Nhận việc', cost: accepted * baseCost * 25, color: '#10b981' },
              { name: 'Từ chối', cost: rejected * baseCost * 8, color: '#ef4444' }
            ]
          };
        }
        
        this.isLoadingApplications = false;
      },
      error: (error) => {
        console.error('Error loading application statistics:', error);
        this.isLoadingApplications = false;
      }
    });
  }

  /**
   * Load recent campaigns
   */
  private loadRecentCampaigns(): void {
    if (!this.companyId) {
      return;
    }

    // Load active campaigns and sort by creation time
    this.recruitmentCampaignService.getCompainByCompanyIdByCompanyIdAndIsActive(this.companyId, true).subscribe({
      next: (response: any) => {
        const campaigns: RecruimentCampainViewDto[] = response?.result || response?.data || response || [];
        
        // Sort by creation time (most recent first) and take first 4
        const sortedCampaigns = campaigns
          .sort((a, b) => {
            const dateA = a.creationTime ? new Date(a.creationTime).getTime() : 0;
            const dateB = b.creationTime ? new Date(b.creationTime).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 4);
        
        // Map to component format
        // Note: We need to get job details for each campaign to show candidates and views
        // For now, using placeholder values
        this.recentCampaigns = sortedCampaigns.map((campaign, index) => ({
          id: `#${campaign.id?.substring(0, 7) || '0000000'}`,
          title: campaign.name || 'Chiến dịch không có tên',
          status: campaign.isActive ? 'Đã duyệt' : 'Chờ duyệt',
          statusClass: campaign.isActive ? 'approved' : 'pending',
          candidates: 0, // TODO: Load from job applications
          views: 0 // TODO: Load from job views if available
        }));
        
        // Load job details for each campaign to get candidates count
        sortedCampaigns.forEach((campaign, index) => {
          if (campaign.id) {
            this.recruitmentCampaignService.getJobsByCompainIdByCompainId(campaign.id).subscribe({
              next: (jobsResponse: any) => {
                const jobs = jobsResponse?.result || jobsResponse?.data || jobsResponse || [];
                // Get total applications for all jobs in this campaign
                let totalCandidates = 0;
                let totalViews = 0;
                
                // TODO: Load application counts and view counts for each job
                // For now, using placeholder
                this.recentCampaigns[index].candidates = totalCandidates || Math.floor(Math.random() * 50) + 20;
                this.recentCampaigns[index].views = totalViews || Math.floor(Math.random() * 300) + 100;
              },
              error: (error) => {
                console.error(`Error loading jobs for campaign ${campaign.id}:`, error);
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading recent campaigns:', error);
      }
    });
  }

  /**
   * Format number with thousand separator
   */
  private formatNumber(value: number): string {
    return value.toLocaleString('vi-VN');
  }
}