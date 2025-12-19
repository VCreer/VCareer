import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLogService } from '../../../../proxy/services/auth/activity-log/activity-log.service';
import type { ActivityLogWithStaffDto, ActivityLogFilterDto } from '../../../../proxy/dto/activity-log-dto/models';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import type { StaffListItemDto } from '../../../../proxy/dto/team-management-dto/models';
import { DateRangePickerComponent, DateRange } from '../../../../shared/components/date-range-picker/date-range-picker';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-history-of-activities',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangePickerComponent, PaginationComponent],
  templateUrl: './history-of-activities.html',
  styleUrls: ['./history-of-activities.scss']
})
export class HistoryOfActivitiesComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 72; // Default collapsed width
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;

  // Activities list
  activities: ActivityLogWithStaffDto[] = [];
  loading = false;
  isTeamLeader = false;
  currentPage = 1;
  itemsPerPage = 20;
  totalCount = 0;
  searchKeyword = '';
  startDate = '';
  endDate = '';

  constructor(
    private activityLogService: ActivityLogService,
    private teamManagementService: TeamManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => this.checkSidebarState(), 100);
    
    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);

    this.checkUserRole();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show') || sidebar.offsetWidth > 100;
      this.sidebarWidth = sidebar.offsetWidth || (this.sidebarExpanded ? 280 : 72);
    }
  }

  checkUserRole(): void {
    this.teamManagementService.getCurrentUserInfo().subscribe({
      next: (userInfo: StaffListItemDto) => {
        this.isTeamLeader = !!userInfo.isLead;
        console.log('User role checked, isTeamLeader:', this.isTeamLeader);
        this.loadActivities();
      },
      error: (error) => {
        console.warn('Error checking user role, defaulting to non-leader:', error);
        // Nếu không phải team leader, vẫn load activities của bản thân
        this.isTeamLeader = false;
        this.loadActivities();
      }
    });
  }

  loadActivities(): void {
    this.loading = true;
    const filter: ActivityLogFilterDto = {
      skipCount: (this.currentPage - 1) * this.itemsPerPage,
      maxResultCount: this.itemsPerPage,
      sorting: 'creationTime DESC'
    };
    
    // Chỉ thêm searchKeyword nếu có giá trị
    if (this.searchKeyword && this.searchKeyword.trim()) {
      filter.searchKeyword = this.searchKeyword.trim();
    }

    // Thêm startDate và endDate nếu có (format: YYYY-MM-DD)
    // Chỉ thêm nếu cả 2 date đều có giá trị
    if (this.startDate && this.endDate) {
      filter.startDate = this.startDate;
      filter.endDate = this.endDate;
      console.log('Date filter applied - StartDate:', filter.startDate, 'EndDate:', filter.endDate);
    } else {
      // Nếu không có đủ cả 2 date, không filter theo date
      console.log('No date filter - showing all activities');
    }

    console.log('Loading activities, isTeamLeader:', this.isTeamLeader);
    console.log('Filter:', JSON.stringify(filter, null, 2));

    const request = this.isTeamLeader
      ? this.activityLogService.getAllStaffActivityLogs(filter)
      : this.activityLogService.getMyActivityLogs(filter);

    request.subscribe({
      next: (response) => {
        console.log('Activities response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // Xử lý response - có thể là object hoặc có property activities
        if (response) {
          if (Array.isArray(response)) {
            // Nếu response là array trực tiếp
            this.activities = response;
            this.totalCount = response.length;
          } else if (response.activities) {
            // Nếu response có property activities
            this.activities = response.activities || [];
            this.totalCount = response.totalCount || response.activities.length || 0;
          } else {
            // Fallback
            this.activities = [];
            this.totalCount = 0;
          }
        } else {
          this.activities = [];
          this.totalCount = 0;
        }
        
        console.log('Parsed activities:', this.activities);
        console.log('Total count:', this.totalCount);
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
        
        // Hiển thị thông báo lỗi cho user
        if (error.status === 404) {
          console.warn('API endpoint not found. Please ensure backend is restarted.');
        } else if (error.status === 401 || error.status === 403) {
          console.warn('Authentication error. Please check user permissions.');
        }
        
        this.activities = [];
        this.totalCount = 0;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadActivities();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadActivities();
  }

  onDateRangeChange(dateRange: DateRange): void {
    console.log('Date range changed:', dateRange);
    // Chỉ set date nếu cả start và end đều có giá trị
    if (dateRange.start && dateRange.end) {
      this.startDate = dateRange.start;
      this.endDate = dateRange.end;
      console.log('StartDate:', this.startDate, 'EndDate:', this.endDate);
      this.currentPage = 1;
      this.loadActivities();
    } else if (!dateRange.start && !dateRange.end) {
      // Nếu clear date range, reset và load lại
      this.startDate = '';
      this.endDate = '';
      this.currentPage = 1;
      this.loadActivities();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getActivityTypeLabel(activityType: string): string {
    const typeMap: { [key: string]: string } = {
      'StaffAdded': 'Thêm HR Staff',
      'CampaignCreated': 'Thêm chiến dịch',
      'JobCreated': 'Thêm công việc',
      'JobPosted': 'Đăng công việc',
      'JobUpdated': 'Cập nhật công việc',
      'JobDeleted': 'Xóa công việc',
      'Login': 'Đăng nhập',
      'Logout': 'Đăng xuất'
    };
    return typeMap[activityType] || activityType;
  }

  formatStaffId(staffId: string | undefined): string {
    if (!staffId) return '-';
    // Chỉ hiển thị 5 ký tự đầu
    return staffId.substring(0, 5);
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.itemsPerPage);
  }
}

