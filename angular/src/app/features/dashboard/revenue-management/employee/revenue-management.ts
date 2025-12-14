import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  ToastNotificationComponent,
  StatCardComponent,
  PaginationComponent,
  SelectFieldComponent,
  SelectOption,
  DatePickerComponent,
} from '../../../../shared/components';

@Component({
  selector: 'app-revenue-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    StatCardComponent,
    PaginationComponent,
    SelectFieldComponent,
    DatePickerComponent,
  ],
  templateUrl: './revenue-management.html',
  styleUrls: ['./revenue-management.scss'],
})
export class RevenueManagementComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  sidebarWidth = 72; // Default collapsed width
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Statistics
  totalRevenue = 0;
  monthlyRevenue = 0;
  totalTransactions = 0;
  pendingPayments = 0;

  // Filters
  searchKeyword = '';
  startDate: string = '';
  endDate: string = '';
  selectedStatus: 'all' | 'completed' | 'pending' | 'failed' = 'all';
  selectedRevenuePeriod: 'today' | 'week' | 'month' | 'year' = 'today';

  // Options for dropdowns
  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'failed', label: 'Thất bại' },
  ];

  revenuePeriodOptions: SelectOption[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'year', label: 'Năm nay' },
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;

  // Revenue data (mock data for now)
  revenueList: any[] = [
    {
      transactionId: 'TXN001',
      companyName: 'Công ty ABC',
      serviceName: 'Gói TOP MAX',
      amount: 5000000,
      transactionDate: new Date('2024-01-15'),
      status: 'completed'
    },
    {
      transactionId: 'TXN002',
      companyName: 'Công ty XYZ',
      serviceName: 'Gói TOP PRO',
      amount: 3000000,
      transactionDate: new Date('2024-01-16'),
      status: 'completed'
    },
    {
      transactionId: 'TXN003',
      companyName: 'Công ty DEF',
      serviceName: 'Gói Tăng điểm CV',
      amount: 2000000,
      transactionDate: new Date('2024-01-17'),
      status: 'pending'
    },
    {
      transactionId: 'TXN004',
      companyName: 'Công ty GHI',
      serviceName: 'Gói TOP ECO PLUS',
      amount: 4000000,
      transactionDate: new Date('2024-01-18'),
      status: 'completed'
    },
    {
      transactionId: 'TXN005',
      companyName: 'Công ty JKL',
      serviceName: 'Gói Badge xác thực',
      amount: 1500000,
      transactionDate: new Date('2024-01-19'),
      status: 'failed'
    },
    {
      transactionId: 'TXN006',
      companyName: 'Công ty MNO',
      serviceName: 'Gói Tăng hạn mức đăng tin',
      amount: 3500000,
      transactionDate: new Date('2024-01-20'),
      status: 'completed'
    },
    {
      transactionId: 'TXN007',
      companyName: 'Công ty PQR',
      serviceName: 'Gói Gia hạn ngày hết hạn',
      amount: 2500000,
      transactionDate: new Date('2024-01-21'),
      status: 'pending'
    },
    {
      transactionId: 'TXN008',
      companyName: 'Công ty STU',
      serviceName: 'Gói TOP MAX PLUS',
      amount: 6000000,
      transactionDate: new Date('2024-01-22'),
      status: 'completed'
    },
    {
      transactionId: 'TXN009',
      companyName: 'Công ty VWX',
      serviceName: 'Gói Tăng điểm Job',
      amount: 2800000,
      transactionDate: new Date('2024-01-23'),
      status: 'completed'
    },
    {
      transactionId: 'TXN010',
      companyName: 'Công ty YZ',
      serviceName: 'Gói Top danh sách',
      amount: 4500000,
      transactionDate: new Date('2024-01-24'),
      status: 'pending'
    },
    {
      transactionId: 'TXN011',
      companyName: 'Công ty Alpha',
      serviceName: 'Gói TOP MAX',
      amount: 5200000,
      transactionDate: new Date('2024-01-25'),
      status: 'completed'
    },
    {
      transactionId: 'TXN012',
      companyName: 'Công ty Beta',
      serviceName: 'Gói TOP PRO',
      amount: 3100000,
      transactionDate: new Date('2024-01-26'),
      status: 'completed'
    },
    {
      transactionId: 'TXN013',
      companyName: 'Công ty Gamma',
      serviceName: 'Gói Tăng điểm CV',
      amount: 2100000,
      transactionDate: new Date('2024-01-27'),
      status: 'pending'
    },
    {
      transactionId: 'TXN014',
      companyName: 'Công ty Delta',
      serviceName: 'Gói TOP ECO PLUS',
      amount: 4100000,
      transactionDate: new Date('2024-01-28'),
      status: 'completed'
    },
    {
      transactionId: 'TXN015',
      companyName: 'Công ty Epsilon',
      serviceName: 'Gói Badge xác thực',
      amount: 1600000,
      transactionDate: new Date('2024-01-29'),
      status: 'failed'
    },
    {
      transactionId: 'TXN016',
      companyName: 'Công ty Zeta',
      serviceName: 'Gói Tăng hạn mức đăng tin',
      amount: 3600000,
      transactionDate: new Date('2024-01-30'),
      status: 'completed'
    },
    {
      transactionId: 'TXN017',
      companyName: 'Công ty Eta',
      serviceName: 'Gói Gia hạn ngày hết hạn',
      amount: 2600000,
      transactionDate: new Date('2024-02-01'),
      status: 'pending'
    },
    {
      transactionId: 'TXN018',
      companyName: 'Công ty Theta',
      serviceName: 'Gói TOP MAX PLUS',
      amount: 6100000,
      transactionDate: new Date('2024-02-02'),
      status: 'completed'
    },
    {
      transactionId: 'TXN019',
      companyName: 'Công ty Iota',
      serviceName: 'Gói Tăng điểm Job',
      amount: 2900000,
      transactionDate: new Date('2024-02-03'),
      status: 'completed'
    },
    {
      transactionId: 'TXN020',
      companyName: 'Công ty Kappa',
      serviceName: 'Gói Top danh sách',
      amount: 4600000,
      transactionDate: new Date('2024-02-04'),
      status: 'pending'
    },
    {
      transactionId: 'TXN021',
      companyName: 'Công ty Lambda',
      serviceName: 'Gói TOP MAX',
      amount: 5300000,
      transactionDate: new Date('2024-02-05'),
      status: 'completed'
    },
    {
      transactionId: 'TXN022',
      companyName: 'Công ty Mu',
      serviceName: 'Gói TOP PRO',
      amount: 3200000,
      transactionDate: new Date('2024-02-06'),
      status: 'completed'
    }
  ];

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'completed': 'Đã hoàn thành',
      'pending': 'Đang chờ',
      'failed': 'Thất bại',
    };
    return statusMap[status] || status;
  }

  viewDetail(item: any): void {
    this.showToastMessage('info', 'Tính năng xem chi tiết đang được phát triển');
    // TODO: Implement view detail modal
  }

  getPaginatedRevenue(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.revenueList.slice(startIndex, endIndex);
  }

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);

    this.loadRevenueData();
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
    const sidePadding = 48; // 24px on each side
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

  loadRevenueData(): void {
    // TODO: Load revenue data from API
    // Mock data for now
    this.totalRevenue = 50000000;
    this.totalTransactions = this.revenueList.length;
    this.pendingPayments = this.revenueList.filter(item => item.status === 'pending').length;
    this.totalItems = this.revenueList.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updateRevenueStats();
  }

  onDateRangeChange(): void {
    this.currentPage = 1;
    this.loadRevenueData();
  }

  onRevenuePeriodChange(period: string): void {
    this.selectedRevenuePeriod = period as 'today' | 'week' | 'month' | 'year';
    this.currentPage = 1;
    this.loadRevenueData();
    this.updateRevenueStats();
  }

  updateRevenueStats(): void {
    // TODO: Update revenue statistics based on selectedRevenuePeriod
    // For now, just update the monthly revenue based on period
    const now = new Date();
    let filteredRevenue = 0;

    switch (this.selectedRevenuePeriod) {
      case 'today':
        filteredRevenue = this.revenueList
          .filter(item => {
            const itemDate = new Date(item.transactionDate);
            return itemDate.toDateString() === now.toDateString() && item.status === 'completed';
          })
          .reduce((sum, item) => sum + item.amount, 0);
        this.monthlyRevenue = filteredRevenue;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filteredRevenue = this.revenueList
          .filter(item => {
            const itemDate = new Date(item.transactionDate);
            return itemDate >= weekStart && item.status === 'completed';
          })
          .reduce((sum, item) => sum + item.amount, 0);
        this.monthlyRevenue = filteredRevenue;
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredRevenue = this.revenueList
          .filter(item => {
            const itemDate = new Date(item.transactionDate);
            return itemDate >= monthStart && item.status === 'completed';
          })
          .reduce((sum, item) => sum + item.amount, 0);
        this.monthlyRevenue = filteredRevenue;
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filteredRevenue = this.revenueList
          .filter(item => {
            const itemDate = new Date(item.transactionDate);
            return itemDate >= yearStart && item.status === 'completed';
          })
          .reduce((sum, item) => sum + item.amount, 0);
        this.monthlyRevenue = filteredRevenue;
        break;
    }
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status as 'all' | 'completed' | 'pending' | 'failed';
    this.currentPage = 1;
    this.loadRevenueData();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRevenueData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRevenueData();
  }

  onExportExcel(): void {
    this.showToastMessage('info', 'Tính năng xuất Excel đang được phát triển');
    // TODO: Implement export to Excel
  }

  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }
}

