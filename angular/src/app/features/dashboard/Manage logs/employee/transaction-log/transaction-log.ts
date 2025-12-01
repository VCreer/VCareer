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
  SelectOption
} from '../../../../../shared/components';

export interface TransactionLog {
  id: string;
  recruiterId: string;
  recruiterName: string;
  transactionType: string;
  serviceName: string;
  amount: number;
  status: string;
  timestamp: Date;
  description?: string;
}

@Component({
  selector: 'app-transaction-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    SelectFieldComponent,
    PaginationComponent
  ],
  templateUrl: './transaction-log.html',
  styleUrls: ['./transaction-log.scss']
})
export class TransactionLogComponent implements OnInit, OnDestroy {
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Logs data
  allLogs: TransactionLog[] = [];
  filteredLogs: TransactionLog[] = [];
  paginatedLogs: TransactionLog[] = [];

  // Search & Filter
  searchKeyword = '';
  filterType = '';
  filterStatus = '';
  filterDateFrom = '';
  filterDateTo = '';
  sortField: 'timestamp' | 'amount' | 'recruiterName' = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Filter options
  transactionTypeOptions: SelectOption[] = [
    { value: '', label: 'Tất cả loại' },
    { value: 'purchase', label: 'Mua dịch vụ' },
    { value: 'refund', label: 'Hoàn tiền' },
    { value: 'renewal', label: 'Gia hạn' }
  ];

  statusOptions: SelectOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'success', label: 'Thành công' },
    { value: 'pending', label: 'Đang xử lý' },
    { value: 'failed', label: 'Thất bại' }
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
        recruiterId: 'r1',
        recruiterName: 'Công ty ABC',
        transactionType: 'purchase',
        serviceName: 'Gói Premium',
        amount: 5000000,
        status: 'success',
        timestamp: new Date('2024-01-15T10:30:00'),
        description: 'Mua gói dịch vụ Premium'
      },
      {
        id: '2',
        recruiterId: 'r2',
        recruiterName: 'Công ty XYZ',
        transactionType: 'renewal',
        serviceName: 'Gói Basic',
        amount: 2000000,
        status: 'pending',
        timestamp: new Date('2024-01-14T14:20:00'),
        description: 'Gia hạn gói Basic'
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
        log.recruiterName.toLowerCase().includes(keyword) ||
        log.serviceName.toLowerCase().includes(keyword) ||
        log.description?.toLowerCase().includes(keyword)
      );
    }

    // Type filter
    if (this.filterType) {
      filtered = filtered.filter(log => log.transactionType === this.filterType);
    }

    // Status filter
    if (this.filterStatus) {
      filtered = filtered.filter(log => log.status === this.filterStatus);
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
      } else if (this.sortField === 'amount') {
        aVal = a.amount;
        bVal = b.amount;
      } else {
        aVal = a.recruiterName;
        bVal = b.recruiterName;
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

  onSort(field: 'timestamp' | 'amount' | 'recruiterName'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'success':
        return 'Thành công';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'purchase':
        return 'Mua dịch vụ';
      case 'refund':
        return 'Hoàn tiền';
      case 'renewal':
        return 'Gia hạn';
      default:
        return type;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

