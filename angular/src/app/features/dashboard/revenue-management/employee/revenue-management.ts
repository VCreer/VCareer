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
import { SubcriptionPriceService } from 'src/app/proxy/services/subcription';
import { 
  OrderDashBoardRequestDto, 
  OrderDashboardViewDto, 
  OrderDetailDashBoardViewDto 
} from 'src/app/proxy/dto/order';
import { 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod 
} from 'src/app/core/enums';
import * as XLSX from 'xlsx';

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
  // Sidebar state
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;

  // Loading states
  isLoading = false;
  isLoadingDetail = false;
  isLoadingStats = false;
  isExporting = false;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Modal
  showDetailModal = false;
  selectedOrder: OrderDashboardViewDto | null = null;
  orderDetails: OrderDetailDashBoardViewDto[] = [];

  // Statistics - BỎ failedPayments
  totalRevenue = 0;
  monthlyRevenue = 0;
  totalTransactions = 0;

  // Filters - BỎ selectedStatus
  searchKeyword = '';
  startDate: string = '';
  endDate: string = '';
  selectedRevenuePeriod: string = 'all';

  // Debounce for Excel export
  private exportDebounceTimer?: any;
  private lastExportTimestamp = 0;
  private readonly EXPORT_DEBOUNCE_TIME = 500;
  private readonly MIN_EXPORT_INTERVAL = 2000;

  // BỎ statusOptions
  revenuePeriodOptions: SelectOption[] = [
    { value: 'all', label: 'Tất cả thời gian' },
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

  // Revenue data
  revenueList: OrderDashboardViewDto[] = [];
  filteredRevenueList: OrderDashboardViewDto[] = [];

  constructor(private subcriptionPriceService: SubcriptionPriceService) {}

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
    this.loadTotalRevenue();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.exportDebounceTimer) {
      clearTimeout(this.exportDebounceTimer);
    }
  }

  // ==================== SIDEBAR METHODS ====================
  
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

  // ==================== DATE HANDLING ====================

  setDateRangeByPeriod(period: string): void {
    if (period === 'all') {
      this.startDate = '';
      this.endDate = '';
      return;
    }

    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    switch (period) {
      case 'today':
        startDate = new Date(now);
        endDate = new Date(now);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        endDate = new Date(now);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    this.startDate = this.formatDateForInput(startDate);
    this.endDate = this.formatDateForInput(endDate);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForAPI(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  // ==================== DATA LOADING ====================

  loadTotalRevenue(): void {
    this.isLoadingStats = true;
    
    this.subcriptionPriceService.getTotalAmountByStartTimeAndEndTime('', '').subscribe({
      next: (total) => {
        this.totalRevenue = total || 0;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading total revenue:', error);
        this.totalRevenue = 0;
        this.isLoadingStats = false;
      }
    });
  }

  loadPeriodRevenue(): void {
    if (!this.startDate || !this.endDate) {
      this.monthlyRevenue = 0;
      return;
    }

    const startDateISO = this.formatDateForAPI(this.startDate);
    const endDate = new Date(this.endDate);
    endDate.setHours(23, 59, 59, 999);
    const endDateISO = endDate.toISOString();

    this.subcriptionPriceService.getTotalAmountByStartTimeAndEndTime(startDateISO, endDateISO).subscribe({
      next: (total) => {
        this.monthlyRevenue = total || 0;
      },
      error: (error) => {
        console.error('Error loading period revenue:', error);
        this.monthlyRevenue = 0;
      }
    });
  }

  loadRevenueData(): void {
    this.isLoading = true;

    // BỎ status filter
    const dto: OrderDashBoardRequestDto = {
      searchField: this.searchKeyword || undefined,
      startDate: this.startDate ? this.formatDateForAPI(this.startDate) : undefined,
      endDate: this.endDate ? (() => {
        const date = new Date(this.endDate);
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
      })() : undefined,
      // status: REMOVED
    };

    this.subcriptionPriceService.getOrderDashboardByDto(dto).subscribe({
      next: (response) => {
        this.revenueList = response || [];
        this.filteredRevenueList = [...this.revenueList];
        this.updateStatistics();
        this.updatePagination();
        this.loadPeriodRevenue();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading revenue data:', error);
        this.showToastMessage('error', 'Không thể tải dữ liệu. Vui lòng thử lại!');
        this.isLoading = false;
        this.revenueList = [];
        this.filteredRevenueList = [];
        this.updateStatistics();
        this.updatePagination();
      }
    });
  }

  // ==================== STATISTICS & PAGINATION ====================

  // BỎ tính toán failedPayments
  updateStatistics(): void {
    this.totalTransactions = this.revenueList.length;
  }

  updatePagination(): void {
    this.totalItems = this.filteredRevenueList.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedRevenue(): OrderDashboardViewDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRevenueList.slice(startIndex, endIndex);
  }

  // ==================== STATUS & FORMATTING ====================

  getStatusText(status?: OrderStatus): string {
    if (status === undefined || status === null) return 'N/A';
    
    switch (status) {
      case OrderStatus.Pending:
        return 'Chờ xử lý';
      case OrderStatus.Processing:
        return 'Đang xử lý';
      case OrderStatus.Completed:
        return 'Đã hoàn thành';
      case OrderStatus.Cancelled:
        return 'Đã hủy';
      case OrderStatus.Failed:
        return 'Thất bại';
      default:
        return 'N/A';
    }
  }

  getStatusClass(status?: OrderStatus): string {
    if (status === undefined || status === null) return '';
    
    switch (status) {
      case OrderStatus.Pending:
        return 'pending';
      case OrderStatus.Processing:
        return 'processing';
      case OrderStatus.Completed:
        return 'completed';
      case OrderStatus.Cancelled:
        return 'cancelled';
      case OrderStatus.Failed:
        return 'failed';
      default:
        return '';
    }
  }

  getPaymentStatusText(status?: PaymentStatus): string {
    if (status === undefined || status === null) return 'N/A';
    
    switch (status) {
      case PaymentStatus.Pending:
        return 'Chờ thanh toán';
      case PaymentStatus.Processing:
        return 'Đang xử lý';
      case PaymentStatus.Paid:
        return 'Đã thanh toán';
      case PaymentStatus.Failed:
        return 'Thất bại';
      case PaymentStatus.Refunded:
        return 'Đã hoàn tiền';
      default:
        return 'N/A';
    }
  }

  getPaymentMethodText(method?: PaymentMethod): string {
    if (method === undefined || method === null) return 'N/A';
    
    switch (method) {
      case PaymentMethod.VNPay:
        return 'VNPay';
      case PaymentMethod.BankTransfer:
        return 'Chuyển khoản';
      case PaymentMethod.Cash:
        return 'Tiền mặt';
      case PaymentMethod.Other:
        return 'Khác';
      default:
        return 'N/A';
    }
  }

  // ==================== EVENT HANDLERS ====================

  onDateRangeChange(): void {
    this.currentPage = 1;
    this.selectedRevenuePeriod = 'all';
    this.loadRevenueData();
  }

  onRevenuePeriodChange(period: string): void {
    this.selectedRevenuePeriod = period;
    this.setDateRangeByPeriod(period);
    this.currentPage = 1;
    this.loadRevenueData();
  }

  // BỎ onStatusChange()

  onSearch(): void {
    this.currentPage = 1;
    this.loadRevenueData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // ==================== MODAL METHODS ====================

  viewDetail(item: OrderDashboardViewDto): void {
    if (!item.id) {
      this.showToastMessage('error', 'Không tìm thấy ID đơn hàng');
      return;
    }

    this.selectedOrder = item;
    this.showDetailModal = true;
    this.isLoadingDetail = true;
    this.orderDetails = [];

    this.subcriptionPriceService.getOrderDetailByOrderId(item.id).subscribe({
      next: (details) => {
        this.orderDetails = details || [];
        this.isLoadingDetail = false;
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.showToastMessage('error', 'Không thể tải chi tiết đơn hàng');
        this.isLoadingDetail = false;
        this.orderDetails = [];
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
    this.orderDetails = [];
  }

  getTotalOrderAmount(): number {
    return this.orderDetails.reduce((sum, detail) => sum + (detail.totalPrice || 0), 0);
  }

  // ==================== EXPORT EXCEL ====================

  onExportExcel(): void {
    if (this.revenueList.length === 0) {
      this.showToastMessage('warning', 'Không có dữ liệu để xuất');
      return;
    }

    if (this.isExporting) {
      console.warn('Export already in progress, ignoring duplicate request');
      return;
    }

    const now = Date.now();
    const timeSinceLastExport = now - this.lastExportTimestamp;
    if (timeSinceLastExport < this.MIN_EXPORT_INTERVAL) {
      console.warn(`Export too soon after last export (${timeSinceLastExport}ms), ignoring`);
      this.showToastMessage('warning', 'Vui lòng đợi một chút trước khi xuất lại');
      return;
    }

    if (this.exportDebounceTimer) {
      clearTimeout(this.exportDebounceTimer);
    }

    this.exportDebounceTimer = setTimeout(() => {
      this.executeExport();
    }, this.EXPORT_DEBOUNCE_TIME);
  }

  private async executeExport(): Promise<void> {
    if (this.isExporting) {
      console.warn('Already exporting, aborting duplicate request');
      return;
    }

    if (this.revenueList.length === 0) {
      return;
    }

    this.isExporting = true;
    this.lastExportTimestamp = Date.now();
    
    console.log('Starting Excel export...');
    console.log('Export timestamp:', this.lastExportTimestamp);

    try {
      const excelData = this.revenueList.map((item, index) => ({
        'STT': index + 1,
        'Mã đơn hàng': item.orderCode || 'N/A',
        'Tên công ty': item.companyName || 'N/A',
        'Số tiền (VNĐ)': item.totalAmount,
        'Ngày thanh toán': item.paidAt ? new Date(item.paidAt).toLocaleString('vi-VN') : 'N/A',
        'Trạng thái': this.getStatusText(item.status),
        'Trạng thái thanh toán': this.getPaymentStatusText(item.paymentStatus),
        'Phương thức thanh toán': this.getPaymentMethodText(item.paymentMethod),
      }));

      const summaryData = [
        {},
        {},
        {
          'STT': 'TỔNG KẾT',
          'Mã đơn hàng': '',
          'Tên công ty': `Tổng số giao dịch: ${this.totalTransactions}`,
          'Số tiền (VNĐ)': this.revenueList.reduce((sum, item) => sum + item.totalAmount, 0),
          'Ngày thanh toán': '',
          'Trạng thái': '',
          'Trạng thái thanh toán': '',
          'Phương thức thanh toán': '',
        }
      ];

      const fullData = [...excelData, ...summaryData];
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(fullData);

      const colWidths = [
        { wch: 5 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
      ];
      ws['!cols'] = colWidths;

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo doanh thu');

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const filename = `BaoCao_DoanhThu_${dateStr}_${timeStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      console.log('Excel export completed successfully');
      this.showToastMessage('success', 'Xuất Excel thành công!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.showToastMessage('error', 'Xuất Excel thất bại. Vui lòng thử lại!');
    } finally {
      this.isExporting = false;
    }
  }

  // ==================== TOAST NOTIFICATION ====================

  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }
}