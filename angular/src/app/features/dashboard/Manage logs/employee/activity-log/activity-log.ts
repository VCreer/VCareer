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
import { LogService } from 'src/app/proxy/services/logs';
import { AuditLogDto, AuditLogActionDto, AuditLogRequestDto } from 'src/app/proxy/dto/log-dto';

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
  filterActivityType = '';
  filterDateFrom = '';
  filterDateTo = '';
  sortField: 'timestamp' | 'staffName' = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Loading state
  isLoading = false;

  // Detail Modal
  showDetailModal = false;
  selectedLog: ActivityLog | null = null;
  logActions: AuditLogActionDto[] = [];
  isLoadingActions = false;

  // Filter options
  activityTypeOptions: SelectOption[] = [
    { value: '', label: 'Tất cả loại' },
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' }
  ];

  constructor(private logService: LogService) {}

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
    this.isLoading = true;
    
    const request: AuditLogRequestDto = {
      userId: undefined,
      startDate: this.filterDateFrom || undefined,
      endDate: this.filterDateTo || undefined
    };

    this.logService.geEmployeetAuditLogs(request).subscribe({
      next: (response: AuditLogDto[]) => {
        this.allLogs = this.mapAuditLogDtoToActivityLog(response);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.showToastMessage('Không thể tải dữ liệu log. Vui lòng thử lại!', 'error');
        this.isLoading = false;
      }
    });
  }

  private mapAuditLogDtoToActivityLog(dtos: AuditLogDto[]): ActivityLog[] {
    return dtos.map(dto => ({
      id: dto.id || '',
      staffId: dto.userId || '',
      staffName: dto.userName || 'N/A',
      staffRole: dto.roleName || 'N/A',
      activityType: dto.httpMethod || 'N/A',
      detail: this.formatLogDetail(dto),
      timestamp: dto.executionTime ? new Date(dto.executionTime) : new Date(),
      httpStatusCode: dto.httpStatusCode,
      url: dto.url,
      browserInfo: dto.browserInfo,
      executionDuration: dto.executionDuration,
      exception: dto.exception
    }));
  }

  private formatLogDetail(dto: AuditLogDto): string {
    const parts: string[] = [];
    
    if (dto.httpMethod) {
      parts.push(dto.httpMethod);
    }
    
    if (dto.url) {
      parts.push(dto.url);
    }
    
    if (dto.httpStatusCode) {
      parts.push(`(${dto.httpStatusCode})`);
    }
    
    return parts.join(' ') || 'Không có chi tiết';
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

    // Activity type filter
    if (this.filterActivityType) {
      filtered = filtered.filter(log => log.activityType === this.filterActivityType);
    }

    // Date filters
    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
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

  // Detail Modal Methods
  onViewDetails(log: ActivityLog): void {
    this.selectedLog = log;
    this.showDetailModal = true;
    this.loadLogActions(log.id);
  }

  loadLogActions(auditLogId: string): void {
    if (!auditLogId) {
      this.logActions = [];
      return;
    }

    this.isLoadingActions = true;
    this.logService.getAuditLogActions(auditLogId).subscribe({
      next: (actions: AuditLogActionDto[]) => {
        this.logActions = actions;
        this.isLoadingActions = false;
      },
      error: (error) => {
        console.error('Error loading log actions:', error);
        this.showToastMessage('Không thể tải chi tiết actions', 'error');
        this.logActions = [];
        this.isLoadingActions = false;
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedLog = null;
    this.logActions = [];
  }

  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatActionExecutionTime(executionTime: string | undefined): string {
    if (!executionTime) return 'N/A';
    try {
      return this.formatDate(new Date(executionTime));
    } catch {
      return 'N/A';
    }
  }

  formatParameters(params: string | undefined): string {
    if (!params) return 'N/A';
    try {
      const parsed = JSON.parse(params);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return params;
    }
  }

  getStatusColorClass(statusCode: number | undefined): string {
    if (!statusCode) return 'status-default';
    if (statusCode >= 200 && statusCode < 300) return 'status-success';
    if (statusCode >= 300 && statusCode < 400) return 'status-info';
    if (statusCode >= 400 && statusCode < 500) return 'status-warning';
    if (statusCode >= 500) return 'status-error';
    return 'status-default';
  }

  // Responsive methods
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
    const padding = 32;
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }
}