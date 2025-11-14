import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  ReportMetricCardComponent,
  StatusItemComponent
} from '../../../../shared/components';

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

  constructor() {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
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
    // TODO: Filter data based on selected time range
    this.showToastMessage(`Đã lọc theo: ${this.timeRanges.find(r => r.value === range)?.label}`, 'info');
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
}
