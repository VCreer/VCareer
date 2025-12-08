import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  ActivityLogTableComponent,
  ActivityLog,
  SelectOption
} from '../../../../../shared/components';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    SelectFieldComponent,
    PaginationComponent,
    ActivityLogTableComponent
  ],
  templateUrl: './activity-log.html',
  styleUrls: ['./activity-log.scss']
})
export class ActivityLogComponent implements OnInit, OnDestroy {
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Logs data
  allLogs: ActivityLog[] = [];
  filteredLogs: ActivityLog[] = [];
  paginatedLogs: ActivityLog[] = [];

  // Search & Filter
  searchKeyword = '';
  filterRole = '';
  filterActivityType = '';
  filterDateFrom = '';
  filterDateTo = '';
  sortField: 'timestamp' | 'staffName' = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Filter options
  roleOptions: SelectOption[] = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' }
  ];

  activityTypeOptions: SelectOption[] = [
    { value: '', label: 'Tất cả loại' },
    { value: 'create', label: 'Tạo mới' },
    { value: 'update', label: 'Cập nhật' },
    { value: 'delete', label: 'Xóa' },
    { value: 'login', label: 'Đăng nhập' },
    { value: 'logout', label: 'Đăng xuất' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.checkSidebarState();
    
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkSidebarState();
      });
      this.resizeObserver.observe(sidebar);
      
      sidebar.addEventListener('mouseenter', () => this.checkSidebarState());
      sidebar.addEventListener('mouseleave', () => this.checkSidebarState());
    }
    
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 50);

    this.loadLogs();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      const newWidth = Math.round(width);
      
      if (this.sidebarWidth !== newWidth) {
        this.sidebarWidth = newWidth;
      }
    } else {
      this.sidebarWidth = 72;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

  loadLogs(): void {
    // Mock data - replace with API call
    this.allLogs = [
      {
        id: '1',
        staffId: 's1',
        staffName: 'Nguyễn Văn A',
        staffRole: 'admin',
        activityType: 'create',
        detail: 'Tạo mới người dùng',
        timestamp: new Date('2024-01-15T10:30:00')
      },
      {
        id: '2',
        staffId: 's2',
        staffName: 'Trần Thị B',
        staffRole: 'manager',
        activityType: 'update',
        detail: 'Cập nhật thông tin công ty',
        timestamp: new Date('2024-01-14T14:20:00')
      }
    ];
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allLogs];

    // Search filter
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(log =>
        log.staffName.toLowerCase().includes(keyword) ||
        log.detail.toLowerCase().includes(keyword)
      );
    }

    // Role filter
    if (this.filterRole) {
      filtered = filtered.filter(log => log.staffRole === this.filterRole);
    }

    // Activity type filter
    if (this.filterActivityType) {
      filtered = filtered.filter(log => log.activityType === this.filterActivityType);
    }

    // Date filters
    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      filtered = filtered.filter(log => log.timestamp >= fromDate);
    }
    if (this.filterDateTo) {
      const toDate = new Date(this.filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= toDate);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      if (this.sortField === 'timestamp') {
        aVal = a.timestamp.getTime();
        bVal = b.timestamp.getTime();
      } else {
        aVal = a.staffName;
        bVal = b.staffName;
      }

      if (this.sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    this.filteredLogs = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedLogs();
  }

  updatePaginatedLogs(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedLogs = this.filteredLogs.slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedLogs();
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onCloseToast(): void {
    this.showToast = false;
  }

  exportLogs(): void {
    // TODO: Implement export functionality
    this.showToastMessage('Đang xuất dữ liệu...', 'info');
  }

  getPageMarginLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getPageWidth(): string {
    if (window.innerWidth <= 768) {
      return '100%';
    }
    return `calc(100% - ${this.sidebarWidth}px)`;
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

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    const padding = 32; // 16px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }
}

