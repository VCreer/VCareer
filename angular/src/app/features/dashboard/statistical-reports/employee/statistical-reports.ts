import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  ToastNotificationComponent,
  SelectFieldComponent,
  SelectOption,
  BarChartComponent,
  BarChartData,
  PieChartComponent,
  PieChartData,
  StatCardComponent,
} from '../../../../shared/components';

@Component({
  selector: 'app-statistical-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    SelectFieldComponent,
    BarChartComponent,
    PieChartComponent,
    StatCardComponent,
  ],
  templateUrl: './statistical-reports.html',
  styleUrls: ['./statistical-reports.scss'],
})
export class StatisticalReportsComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Time period filter
  selectedPeriod: 'today' | 'week' | 'month' | 'year' = 'today';
  periodOptions: SelectOption[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'year', label: 'Năm nay' },
  ];

  // Stats data
  totalJobs: number = 0;
  totalUsers: number = 0;
  totalRevenue: number = 0;

  // Chart data
  chartData: BarChartData[] = [];
  chartHeight: number = 400;
  
  // Pie chart data for user management
  pieChartData: PieChartData[] = [
    { label: 'Recruiter', value: 450, color: '#0F83BA' },
    { label: 'Candidate', value: 1200, color: '#10b981' },
    { label: 'Employee', value: 85, color: '#f59e0b' },
  ];
  pieChartSize: number = 300;
  pieChartSectionHeight: number = 400;

  // Recent activities data
  recentActivities: Array<{
    time: string;
    activityType: string;
    user: string;
    company: string;
  }> = [];

  // Donut chart data for service packages
  donutChartData: PieChartData[] = [];
  donutChartSize: number = 300;


  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);

    this.loadChartData();
    this.loadPieChartData();
    this.loadRecentActivities();
    this.loadDonutChartData();
    this.loadStats();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || rect.width > 100;
    } else {
      this.sidebarWidth = 0;
      this.sidebarExpanded = false;
    }
  }

  getContentPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return 'calc(100vw - 32px)';
    }
    const sidePadding = 48;
    const availableWidth = viewportWidth - this.sidebarWidth - sidePadding;
    const maxContentWidth = Math.min(1400, Math.max(900, availableWidth));
    return `${maxContentWidth}px`;
  }

  getBreadcrumbLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getBreadcrumbWidth(): string {
    if (window.innerWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period as 'today' | 'week' | 'month' | 'year';
    this.loadChartData();
  }

  loadChartData(): void {
    // TODO: Load data from API based on selectedPeriod
    // Mock data for now - similar to "Quản lý tin tuyển dụng"
    const mockData: BarChartData[] = [
      { label: 'Thứ 2', value: 45, color: '#0F83BA' },
      { label: 'Thứ 3', value: 52, color: '#0F83BA' },
      { label: 'Thứ 4', value: 38, color: '#0F83BA' },
      { label: 'Thứ 5', value: 61, color: '#0F83BA' },
      { label: 'Thứ 6', value: 55, color: '#0F83BA' },
      { label: 'Thứ 7', value: 48, color: '#0F83BA' },
      { label: 'CN', value: 35, color: '#0F83BA' },
    ];

    // Adjust data based on selected period
    switch (this.selectedPeriod) {
      case 'today':
        this.chartData = [
          { label: '0h', value: 5, color: '#0F83BA' },
          { label: '4h', value: 8, color: '#10b981' },
          { label: '8h', value: 12, color: '#f59e0b' },
          { label: '12h', value: 15, color: '#ef4444' },
          { label: '16h', value: 18, color: '#8b5cf6' },
          { label: '20h', value: 10, color: '#ec4899' },
        ];
        break;
      case 'week':
        this.chartData = mockData;
        break;
      case 'month':
        this.chartData = [
          { label: 'Tuần 1', value: 180 },
          { label: 'Tuần 2', value: 220 },
          { label: 'Tuần 3', value: 195 },
          { label: 'Tuần 4', value: 240 },
        ];
        break;
      case 'year':
        this.chartData = [
          { label: 'T1', value: 850 },
          { label: 'T2', value: 920 },
          { label: 'T3', value: 780 },
          { label: 'T4', value: 950 },
          { label: 'T5', value: 1100 },
          { label: 'T6', value: 1050 },
          { label: 'T7', value: 1200 },
          { label: 'T8', value: 1150 },
          { label: 'T9', value: 1300 },
          { label: 'T10', value: 1250 },
          { label: 'T11', value: 1400 },
          { label: 'T12', value: 1350 },
        ];
        break;
    }
  }

  loadPieChartData(): void {
    // TODO: Load data from API for user management
    // Mock data for "Quản lý người dùng"
    this.pieChartData = [
      { label: 'Recruiter', value: 450, color: '#0F83BA' },
      { label: 'Candidate', value: 1200, color: '#10b981' },
      { label: 'Employee', value: 85, color: '#f59e0b' },
    ];
  }


  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  loadRecentActivities(): void {
    // Hard-coded data for "Hoạt động gần đây"
    this.recentActivities = [
      {
        time: '10:30 - 15/01/2025',
        activityType: 'Đăng tin tuyển dụng',
        user: 'Nguyễn Văn A',
        company: 'Công ty ABC'
      },
      {
        time: '09:15 - 15/01/2025',
        activityType: 'Cập nhật hồ sơ',
        user: 'Trần Thị B',
        company: 'Công ty XYZ'
      },
      {
        time: '14:20 - 14/01/2025',
        activityType: 'Ứng tuyển',
        user: 'Lê Văn C',
        company: 'Công ty DEF'
      },
      {
        time: '16:45 - 14/01/2025',
        activityType: 'Xem hồ sơ',
        user: 'Phạm Thị D',
        company: 'Công ty GHI'
      },
      {
        time: '11:00 - 14/01/2025',
        activityType: 'Đăng tin tuyển dụng',
        user: 'Hoàng Văn E',
        company: 'Công ty JKL'
      },
      {
        time: '08:30 - 14/01/2025',
        activityType: 'Cập nhật hồ sơ',
        user: 'Vũ Thị F',
        company: 'Công ty MNO'
      },
      {
        time: '13:15 - 13/01/2025',
        activityType: 'Ứng tuyển',
        user: 'Đặng Văn G',
        company: 'Công ty PQR'
      },
      {
        time: '15:50 - 13/01/2025',
        activityType: 'Xem hồ sơ',
        user: 'Bùi Thị H',
        company: 'Công ty STU'
      },
      {
        time: '10:00 - 13/01/2025',
        activityType: 'Đăng tin tuyển dụng',
        user: 'Đỗ Văn I',
        company: 'Công ty VWX'
      },
      {
        time: '12:30 - 12/01/2025',
        activityType: 'Cập nhật hồ sơ',
        user: 'Ngô Thị K',
        company: 'Công ty YZ'
      }
    ];
  }

  loadDonutChartData(): void {
    // Hard-coded data for "Quản lý gói dịch vụ" - Donut Chart
    this.donutChartData = [
      { label: 'Gói cơ bản', value: 450, color: '#0F83BA' },
      { label: 'Gói nâng cao', value: 320, color: '#10b981' },
      { label: 'Gói premium', value: 180, color: '#f59e0b' },
    ];
  }

  loadStats(): void {
    // TODO: Load stats from API
    // Hard-coded data for stats
    this.totalJobs = 1250;
    this.totalUsers = 1735; // 450 + 1200 + 85
    this.totalRevenue = 125000000; // 125 triệu VNĐ
  }
}

