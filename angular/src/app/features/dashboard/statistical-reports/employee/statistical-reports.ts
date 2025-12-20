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
import { JobPostService } from '../../../../proxy/services/job';
import { JobStatus } from '../../../../proxy/constants/job-constant/job-status.enum';
import { UserService } from '../../../../proxy/services/user/user.service';
import { SubcriptionPriceService } from '../../../../proxy/services/subcription';
import { JobRequestViewDto, JobViewManageDetailDto, JobApproveViewDto, JobFilterDto } from '../../../../proxy/dto/job-dto';

// Interface chung để xử lý cả 3 loại job
interface UnifiedJob {
  id?: string;
  status?: JobStatus;
  approveAt?: string;
  postedAt?: string;
}

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
  private dataRefreshInterval?: any;
  private visibilityChangeListener?: () => void;

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

  constructor(
    private jobPostService: JobPostService,
    private userService: UserService,
    private subcriptionPriceService: SubcriptionPriceService
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);

    // Reload dữ liệu khi window được focus lại
    this.visibilityChangeListener = () => {
      if (!document.hidden) {
        this.refreshAllData();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeListener);

    // Tự động reload dữ liệu mỗi 30 giây
    this.dataRefreshInterval = setInterval(() => {
      this.refreshAllData();
    }, 30000); // 30 giây

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
    if (this.dataRefreshInterval) {
      clearInterval(this.dataRefreshInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.visibilityChangeListener) {
      document.removeEventListener('visibilitychange', this.visibilityChangeListener);
    }
  }

  private refreshAllData(): void {
    // Reload tất cả dữ liệu khi có thay đổi
    this.loadChartData();
    this.loadStats();
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
    // Tính toán khoảng thời gian dựa trên selectedPeriod để filter ở frontend
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    switch (this.selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Tuần này (từ thứ 2 đến chủ nhật)
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Nếu là CN thì lùi 6 ngày, nếu không thì về thứ 2
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diff);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Lấy TẤT CẢ job: Pending, Open, và Rejected
    let pendingJobs: JobApproveViewDto[] = [];
    let openJobs: JobViewManageDetailDto[] = [];
    let rejectedJobs: JobViewManageDetailDto[] = [];
    let completedRequests = 0;

    const processAllJobs = () => {
      completedRequests++;
      if (completedRequests === 3) {
        // Merge tất cả job lại
        const allJobs = this.mergeAllJobs(pendingJobs, openJobs, rejectedJobs);
        console.log('Total jobs loaded:', {
          pending: pendingJobs.length,
          open: openJobs.length,
          rejected: rejectedJobs.length,
          total: allJobs.length
        });
        console.log('Selected period:', this.selectedPeriod);
        console.log('Date range:', { 
          start: startDate.toISOString(), 
          end: endDate.toISOString(),
          startLocal: startDate.toLocaleString('vi-VN'),
          endLocal: endDate.toLocaleString('vi-VN')
        });
        
        // Filter theo khoảng thời gian
        const filteredJobs = this.filterJobsByPeriod(allJobs, startDate, endDate);
        console.log('Filtered jobs by period:', filteredJobs.length);
        
        // Group dữ liệu theo khoảng thời gian
        this.chartData = this.groupJobsByPeriod(filteredJobs, this.selectedPeriod);
        console.log('Chart data:', this.chartData);
        
        // Tính tổng số job trong biểu đồ để so sánh
        const totalInChart = this.chartData.reduce((sum, item) => sum + item.value, 0);
        console.log('Total jobs in chart:', totalInChart);
        console.log('Expected total (from filtered):', filteredJobs.length);
      }
    };

    // Lấy job Pending
    const pendingFilter: JobFilterDto = {
      page: 1,
      pageSize: 10000
    };
    this.jobPostService.showJobPostNeedApproveByDto(pendingFilter).subscribe({
      next: (jobs: JobApproveViewDto[]) => {
        pendingJobs = jobs || [];
        processAllJobs();
      },
      error: (error) => {
        console.error('Error loading pending jobs:', error);
        processAllJobs();
      }
    });

    // Lấy job Open (đã duyệt)
    const openRequest: JobRequestViewDto = {
      status: JobStatus.Open,
      page: 1,
      pageSize: 10000
    };
    this.jobPostService.getJobPostManageByDto(openRequest).subscribe({
      next: (jobs: JobViewManageDetailDto[]) => {
        openJobs = jobs || [];
        processAllJobs();
      },
      error: (error) => {
        console.error('Error loading open jobs:', error);
        processAllJobs();
      }
    });

    // Lấy job Rejected
    const rejectedRequest: JobRequestViewDto = {
      status: JobStatus.Rejected,
      page: 1,
      pageSize: 10000
    };
    this.jobPostService.getJobPostManageByDto(rejectedRequest).subscribe({
      next: (jobs: JobViewManageDetailDto[]) => {
        rejectedJobs = jobs || [];
        processAllJobs();
      },
      error: (error) => {
        console.error('Error loading rejected jobs:', error);
        processAllJobs();
      }
    });
  }

  private mergeAllJobs(
    pendingJobs: JobApproveViewDto[], 
    openJobs: JobViewManageDetailDto[], 
    rejectedJobs: JobViewManageDetailDto[]
  ): UnifiedJob[] {
    const allJobs: UnifiedJob[] = [];
    
    // Thêm Pending jobs (dùng postedAt)
    pendingJobs.forEach(job => {
      allJobs.push({
        id: job.id,
        status: JobStatus.Pending,
        postedAt: job.postedAt
      });
    });
    
    // Thêm Open jobs (dùng approveAt)
    openJobs.forEach(job => {
      allJobs.push({
        id: job.id,
        status: JobStatus.Open,
        approveAt: job.approveAt,
        postedAt: job.postedAt
      });
    });
    
    // Thêm Rejected jobs (dùng approveAt)
    rejectedJobs.forEach(job => {
      allJobs.push({
        id: job.id,
        status: JobStatus.Rejected,
        approveAt: job.approveAt,
        postedAt: job.postedAt
      });
    });
    
    return allJobs;
  }

  private filterJobsByPeriod(jobs: UnifiedJob[], startDate: Date, endDate: Date): UnifiedJob[] {
    const filtered = jobs.filter(job => {
      // Xác định trường thời gian dựa trên status
      // Pending: dùng postedAt
      // Open/Rejected: dùng approveAt (nếu có), nếu không thì dùng postedAt
      let dateStr: string | undefined;
      
      if (job.status === JobStatus.Pending) {
        dateStr = job.postedAt;
      } else {
        // Open hoặc Rejected: ưu tiên approveAt, nếu không có thì dùng postedAt
        dateStr = job.approveAt || job.postedAt;
      }
      
      if (!dateStr) {
        console.log('Job has no date field:', { id: job.id, status: job.status });
        return false;
      }
      
      const jobDate = new Date(dateStr);
      const jobTime = jobDate.getTime();
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      const isInRange = jobTime >= startTime && jobTime <= endTime;
      
      if (!isInRange) {
        console.log('Job filtered out:', {
          id: job.id,
          status: job.status,
          dateField: job.status === JobStatus.Pending ? 'postedAt' : (job.approveAt ? 'approveAt' : 'postedAt'),
          dateValue: dateStr,
          dateTime: jobTime,
          startTime: startTime,
          endTime: endTime,
          isBefore: jobTime < startTime,
          isAfter: jobTime > endTime
        });
      } else {
        console.log('Job included:', {
          id: job.id,
          status: job.status,
          dateField: job.status === JobStatus.Pending ? 'postedAt' : (job.approveAt ? 'approveAt' : 'postedAt'),
          dateValue: dateStr
        });
      }
      
      return isInRange;
    });
    
    console.log(`Filtered ${filtered.length} jobs from ${jobs.length} total jobs`);
    console.log('Date range for filter:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startLocal: startDate.toLocaleString('vi-VN'),
      endLocal: endDate.toLocaleString('vi-VN')
    });
    
    return filtered;
  }

  private groupJobsByPeriod(jobs: UnifiedJob[], period: 'today' | 'week' | 'month' | 'year'): BarChartData[] {
    if (!jobs || jobs.length === 0) {
      return this.getEmptyChartData(period);
    }

    switch (period) {
      case 'today':
        return this.groupByHours(jobs);
      case 'week':
        return this.groupByDaysOfWeek(jobs);
      case 'month':
        return this.groupByWeeksOfMonth(jobs);
      case 'year':
        return this.groupByMonthsOfYear(jobs);
      default:
        return [];
    }
  }

  private groupByHours(jobs: UnifiedJob[]): BarChartData[] {
    const hourGroups: { [key: number]: number } = {};
    // Group theo khoảng giờ: 0-3h, 4-7h, 8-11h, 12-15h, 16-19h, 20-23h
    const hourRanges = [
      { start: 0, end: 3, label: '0-3h' },
      { start: 4, end: 7, label: '4-7h' },
      { start: 8, end: 11, label: '8-11h' },
      { start: 12, end: 15, label: '12-15h' },
      { start: 16, end: 19, label: '16-19h' },
      { start: 20, end: 23, label: '20-23h' }
    ];
    
    // Khởi tạo tất cả khoảng giờ với giá trị 0
    hourRanges.forEach((range, index) => {
      hourGroups[index] = 0;
    });

    jobs.forEach(job => {
      // Xác định trường thời gian dựa trên status
      const dateStr = job.status === JobStatus.Pending 
        ? job.postedAt 
        : (job.approveAt || job.postedAt);
      
      if (dateStr) {
        const date = new Date(dateStr);
        const hour = date.getHours();
        
        // Tìm khoảng giờ phù hợp
        const rangeIndex = hourRanges.findIndex(range => hour >= range.start && hour <= range.end);
        if (rangeIndex !== -1) {
          hourGroups[rangeIndex] = (hourGroups[rangeIndex] || 0) + 1;
        }
      }
    });

    return hourRanges.map((range, index) => ({
      label: range.label,
      value: hourGroups[index] || 0,
      color: '#0F83BA'
    }));
  }

  private groupByDaysOfWeek(jobs: UnifiedJob[]): BarChartData[] {
    const dayGroups: { [key: number]: number } = {};
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    // Khởi tạo tất cả ngày với giá trị 0
    for (let i = 0; i < 7; i++) {
      dayGroups[i] = 0;
    }

    jobs.forEach(job => {
      // Xác định trường thời gian dựa trên status
      const dateStr = job.status === JobStatus.Pending 
        ? job.postedAt 
        : (job.approveAt || job.postedAt);
      
      if (dateStr) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0 = CN, 1 = T2, ...
        dayGroups[dayOfWeek] = (dayGroups[dayOfWeek] || 0) + 1;
      }
    });

    return dayNames.map((name, index) => ({
      label: name,
      value: dayGroups[index] || 0,
      color: '#0F83BA'
    }));
  }

  private groupByWeeksOfMonth(jobs: UnifiedJob[]): BarChartData[] {
    const weekGroups: { [key: number]: number } = {};
    
    // Khởi tạo 5 tuần (tháng có thể có 5 tuần)
    for (let i = 1; i <= 5; i++) {
      weekGroups[i] = 0;
    }

    jobs.forEach(job => {
      // Xác định trường thời gian dựa trên status
      const dateStr = job.status === JobStatus.Pending 
        ? job.postedAt 
        : (job.approveAt || job.postedAt);
      
      if (dateStr) {
        const date = new Date(dateStr);
        const dayOfMonth = date.getDate();
        
        // Tính tuần dựa trên số ngày từ đầu tháng
        // Tuần 1: ngày 1-7, Tuần 2: ngày 8-14, Tuần 3: ngày 15-21, Tuần 4: ngày 22-28, Tuần 5: ngày 29-31
        const weekNumber = Math.ceil(dayOfMonth / 7);
        const week = Math.min(weekNumber, 5); // Tối đa 5 tuần
        weekGroups[week] = (weekGroups[week] || 0) + 1;
      }
    });

    // Chỉ hiển thị các tuần có dữ liệu hoặc ít nhất 4 tuần
    const weeksWithData = Object.keys(weekGroups).filter(w => weekGroups[parseInt(w)] > 0).map(w => parseInt(w));
    const maxWeek = Math.max(...weeksWithData, 4);
    
    return Array.from({ length: maxWeek }, (_, i) => i + 1).map(week => ({
      label: `Tuần ${week}`,
      value: weekGroups[week] || 0,
      color: '#0F83BA'
    }));
  }

  private groupByMonthsOfYear(jobs: UnifiedJob[]): BarChartData[] {
    const monthGroups: { [key: number]: number } = {};
    
    // Khởi tạo 12 tháng
    for (let i = 1; i <= 12; i++) {
      monthGroups[i] = 0;
    }

    jobs.forEach(job => {
      // Xác định trường thời gian dựa trên status
      const dateStr = job.status === JobStatus.Pending 
        ? job.postedAt 
        : (job.approveAt || job.postedAt);
      
      if (dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1; // 1-12
        monthGroups[month] = (monthGroups[month] || 0) + 1;
      }
    });

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => ({
      label: `T${month}`,
      value: monthGroups[month] || 0,
      color: '#0F83BA'
    }));
  }

  private getEmptyChartData(period: 'today' | 'week' | 'month' | 'year'): BarChartData[] {
    switch (period) {
      case 'today':
        return [
          { label: '0-3h', value: 0, color: '#0F83BA' },
          { label: '4-7h', value: 0, color: '#0F83BA' },
          { label: '8-11h', value: 0, color: '#0F83BA' },
          { label: '12-15h', value: 0, color: '#0F83BA' },
          { label: '16-19h', value: 0, color: '#0F83BA' },
          { label: '20-23h', value: 0, color: '#0F83BA' }
        ];
      case 'week':
        return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => ({ label: day, value: 0, color: '#0F83BA' }));
      case 'month':
        return [1, 2, 3, 4].map(week => ({ label: `Tuần ${week}`, value: 0, color: '#0F83BA' }));
      case 'year':
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => ({ label: `T${month}`, value: 0, color: '#0F83BA' }));
      default:
        return [];
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
    this.loadTotalJobs();
    this.loadTotalUsers();
    this.loadTotalRevenue();
  }

  private loadTotalJobs(): void {
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let completedRequests = 0;

    const updateTotal = () => {
      completedRequests++;
      if (completedRequests === 3) {
        this.totalJobs = pendingCount + approvedCount + rejectedCount;
      }
    };

    // Load count for Pending
    this.jobPostService.countJobByStatusByStatus(JobStatus.Pending).subscribe({
      next: (count) => {
        pendingCount = count;
        updateTotal();
      },
      error: (error) => {
        console.error('Error loading pending count:', error);
        updateTotal();
      }
    });

    // Load count for Open (Approved)
    this.jobPostService.countJobByStatusByStatus(JobStatus.Open).subscribe({
      next: (count) => {
        approvedCount = count;
        updateTotal();
      },
      error: (error) => {
        console.error('Error loading approved count:', error);
        updateTotal();
      }
    });

    // Load count for Rejected
    this.jobPostService.countJobByStatusByStatus(JobStatus.Rejected).subscribe({
      next: (count) => {
        rejectedCount = count;
        updateTotal();
      },
      error: (error) => {
        console.error('Error loading rejected count:', error);
        updateTotal();
      }
    });
  }

  private loadTotalUsers(): void {
    let recruiterCount = 0;
    let candidateCount = 0;
    let employeeCount = 0;
    let completedRequests = 0;

    const updateTotal = () => {
      completedRequests++;
      if (completedRequests === 3) {
        this.totalUsers = recruiterCount + candidateCount + employeeCount;
        // Cập nhật pie chart data
        this.pieChartData = [
          { label: 'Recruiter', value: recruiterCount, color: '#0F83BA' },
          { label: 'Candidate', value: candidateCount, color: '#10b981' },
          { label: 'Employee', value: employeeCount, color: '#f59e0b' },
        ];
      }
    };

    // Load count for Recruiter (RoleType = 2)
    this.userService.getUsersInfoByRole(2).subscribe({
      next: (users) => {
        recruiterCount = users?.length || 0;
        updateTotal();
      },
      error: (error) => {
        console.error('Error loading recruiter users:', error);
        updateTotal();
      }
    });

    // Load count for Candidate (RoleType = 3)
    this.userService.getUsersInfoByRole(3).subscribe({
      next: (users) => {
        candidateCount = users?.length || 0;
        updateTotal();
      },
      error: (error) => {
        console.error('Error loading candidate users:', error);
        updateTotal();
      }
    });

    // Load count for Employee (RoleType = 1)
    this.userService.getUsersInfoByRole(1).subscribe({
      next: (users) => {
        employeeCount = users?.length || 0;
        updateTotal();
      },
      error: (error) => {
        console.error('Error loading employee users:', error);
        updateTotal();
      }
    });
  }

  private loadTotalRevenue(): void {
    // Gọi API lấy tổng doanh thu (tất cả thời gian) - truyền '' cho cả startTime và endTime
    this.subcriptionPriceService.getTotalAmountByStartTimeAndEndTime('', '').subscribe({
      next: (total) => {
        this.totalRevenue = total || 0;
      },
      error: (error) => {
        console.error('Error loading total revenue:', error);
        this.totalRevenue = 0;
      }
    });
  }
}

