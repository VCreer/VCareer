import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  ToastNotificationComponent,
  InputFieldComponent,
  PaginationComponent,
  GenericModalComponent
} from '../../../../shared/components';
import { SubcriptionPriceService } from 'src/app/proxy/services/subcription';
import { SubcriptionService_Service } from 'src/app/proxy/services/subcription';
import {
  SubcriptionPriceCreateDto,
  SubcriptionPriceUpdateDto,
  SubcriptionPriceViewDto,
  SubcriptionsViewDto
} from 'src/app/proxy/dto/subcriptions/models';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-manage-subscription-prices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    PaginationComponent,
    GenericModalComponent
  ],
  templateUrl: './service-price-list.html',
  styleUrls: ['./service-price-list.scss']
})
export class ServicePriceListComponent implements OnInit, OnDestroy {
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  subcriptionId: string = '';
  subcriptionInfo: SubcriptionsViewDto | null = null;
  currentPrice: number = 0;

  allPrices: SubcriptionPriceViewDto[] = [];
  paginatedPrices: SubcriptionPriceViewDto[] = [];

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  showActionsMenu: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  showCreatePriceModal = false;
  showEditPriceModal = false;
  selectedPrice: SubcriptionPriceViewDto | null = null;

  isLoadingPrices = false;
  isLoadingCurrentPrice = false;
  isSavingPrice = false;
  isSavingPriceEdit = false;
  validationErrors: Record<string, string> = {};

  // Price Form
  priceForm: SubcriptionPriceCreateDto = this.getDefaultPriceForm();

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private priceService: SubcriptionPriceService,
    private subcriptionService: SubcriptionService_Service
  ) {}

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

    // Get subcription ID from route
    this.route.params.subscribe(params => {
      this.subcriptionId = params['id'];
      if (this.subcriptionId) {
        this.loadSubcriptionInfo();
        this.loadCurrentPrice();
        this.loadPrices();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private getDefaultPriceForm(): SubcriptionPriceCreateDto {
    return {
      subcriptionServiceId: '',
      newPrice: 0,
      effectiveFrom: this.formatDateForInput(new Date()),
      effectiveTo: undefined
    };
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

  loadSubcriptionInfo(): void {
    this.subcriptionService.getActiveSubscriptionServices(undefined)
      .subscribe({
        next: (response: SubcriptionsViewDto[]) => {
          this.subcriptionInfo = response.find(s => s.id === this.subcriptionId) || null;
        },
        error: (error) => {
          console.error('Error loading subcription info:', error);
        }
      });
  }

  loadCurrentPrice(): void {
    this.isLoadingCurrentPrice = true;

    this.priceService.getCurrentPriceOfSubcriptionBySubcriptionId(this.subcriptionId)
      .pipe(finalize(() => {
        this.isLoadingCurrentPrice = false;
      }))
      .subscribe({
        next: (price: number) => {
          this.currentPrice = price;
        },
        error: (error) => {
          console.error('Error loading current price:', error);
          this.showToastMessage('Không thể tải giá hiện tại', 'error');
        }
      });
  }

  loadPrices(): void {
    this.isLoadingPrices = true;

    this.priceService.getSubcriptionPricesServiceBySubcriptionIdAndPageIndex(
      this.subcriptionId,
      this.currentPage - 1
    )
      .pipe(finalize(() => {
        this.isLoadingPrices = false;
      }))
      .subscribe({
        next: (response: SubcriptionPriceViewDto[]) => {
          this.allPrices = response;
          this.updatePagination();
          this.showToastMessage('Tải danh sách giá thành công', 'success');
        },
        error: (error) => {
          console.error('Error loading prices:', error);
          this.showToastMessage('Không thể tải danh sách giá', 'error');
          this.allPrices = [];
          this.updatePagination();
        }
      });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.allPrices.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedPrices = this.allPrices.slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPrices();
  }

  // CRUD Actions
  onCreatePrice(): void {
    this.resetPriceForm();
    this.resetValidationErrors();
    this.priceForm.subcriptionServiceId = this.subcriptionId;
    this.showCreatePriceModal = true;
  }

  resetPriceForm(): void {
    this.priceForm = this.getDefaultPriceForm();
    this.selectedPrice = null;
    this.resetValidationErrors();
  }

  onConfirmCreatePrice(): void {
    if (this.isSavingPrice) {
      return;
    }

    if (!this.validatePriceForm()) {
      return;
    }

    this.isSavingPrice = true;

    const createDto: SubcriptionPriceCreateDto = {
      ...this.priceForm,
      subcriptionServiceId: this.subcriptionId
    };

    this.priceService.createSubcriptionPriceByDto(createDto)
      .pipe(finalize(() => {
        setTimeout(() => (this.isSavingPrice = false), 250);
      }))
      .subscribe({
        next: () => {
          this.showToastMessage('Tạo giá thành công', 'success');
          this.showCreatePriceModal = false;
          this.loadPrices();
          this.loadCurrentPrice();
        },
        error: (error) => {
          console.error('Error creating price:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể tạo giá';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onEditPrice(price: SubcriptionPriceViewDto): void {
    this.selectedPrice = price;
    this.priceForm = {
      subcriptionServiceId: price.subcriptionServiceId,
      newPrice: price.newPrice,
      effectiveFrom: price.effectiveFrom,
      effectiveTo: price.effectiveTo
    };
    this.resetValidationErrors();
    this.showEditPriceModal = true;
    this.closeActionsMenu();
  }

  onConfirmEditPrice(): void {
    if (this.isSavingPriceEdit || !this.selectedPrice) {
      return;
    }

    if (!this.validatePriceForm()) {
      return;
    }

    this.isSavingPriceEdit = true;

    const updateDto: SubcriptionPriceUpdateDto = {
      subcriptionPriceId: this.getSubcriptionPriceId(this.selectedPrice),
      subcriptionServiceId: this.subcriptionId,
      newPrice: this.priceForm.newPrice,
      effectiveFrom: this.priceForm.effectiveFrom,
      effectiveTo: this.priceForm.effectiveTo
    };

    this.priceService.updateSubcriptionPrice(updateDto)
      .pipe(finalize(() => {
        setTimeout(() => (this.isSavingPriceEdit = false), 250);
      }))
      .subscribe({
        next: () => {
          this.showToastMessage('Cập nhật giá thành công', 'success');
          this.showEditPriceModal = false;
          this.selectedPrice = null;
          this.loadPrices();
          this.loadCurrentPrice();
        },
        error: (error) => {
          console.error('Error updating price:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể cập nhật giá';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onToggleActive(price: SubcriptionPriceViewDto): void {
    const priceId = this.getSubcriptionPriceId(price);
    if (!priceId) {
      this.showToastMessage('Không tìm thấy ID giá', 'error');
      return;
    }

    const newIsActive = !price.isActive;

    this.priceService.setStatusSubcriptionPrice(priceId, newIsActive)
      .subscribe({
        next: () => {
          this.showToastMessage(
            newIsActive ? 'Đã kích hoạt giá' : 'Đã vô hiệu hóa giá',
            'success'
          );
          this.loadPrices();
          this.loadCurrentPrice();
        },
        error: (error) => {
          console.error('Error toggling price status:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể thay đổi trạng thái giá';
          this.showToastMessage(errorMsg, 'error');
        }
      });

    this.closeActionsMenu();
  }

  onDeletePrice(price: SubcriptionPriceViewDto): void {
    const priceId = this.getSubcriptionPriceId(price);
    if (!priceId) {
      this.showToastMessage('Không tìm thấy ID giá', 'error');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa giá này? Hành động này không thể hoàn tác.')) {
      return;
    }

    this.priceService.deleteSubcriptionPrice(priceId)
      .subscribe({
        next: () => {
          this.showToastMessage('Đã xóa giá', 'success');
          this.loadPrices();
          this.loadCurrentPrice();
        },
        error: (error) => {
          console.error('Error deleting price:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể xóa giá';
          this.showToastMessage(errorMsg, 'error');
        }
      });

    this.closeActionsMenu();
  }

  private validatePriceForm(): boolean {
    this.resetValidationErrors();
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate newPrice
    if (!this.priceForm.newPrice || this.priceForm.newPrice <= 0) {
      errors['newPrice'] = 'Giá mới phải lớn hơn 0';
      isValid = false;
    }

    // Validate effectiveFrom
    if (!this.priceForm.effectiveFrom) {
      errors['effectiveFrom'] = 'Vui lòng chọn ngày bắt đầu';
      isValid = false;
    }

    // Validate effectiveTo
    if (!this.priceForm.effectiveTo) {
      errors['effectiveTo'] = 'Vui lòng chọn ngày kết thúc';
      isValid = false;
    }

    // Validate date range logic
    if (this.priceForm.effectiveFrom && this.priceForm.effectiveTo) {
      const from = new Date(this.priceForm.effectiveFrom);
      const to = new Date(this.priceForm.effectiveTo);
      
      if (from >= to) {
        errors['effectiveTo'] = 'Ngày kết thúc phải sau ngày bắt đầu';
        isValid = false;
      }
      
      // Kiểm tra trùng lặp khoảng thời gian
      if (isValid && this.checkDateRangeOverlap(this.priceForm.effectiveFrom, this.priceForm.effectiveTo)) {
        errors['effectiveFrom'] = 'Khoảng thời gian này đã có giá khác';
        errors['effectiveTo'] = 'Khoảng thời gian bị trùng với giá đã tồn tại';
        isValid = false;
      }
    }

    this.validationErrors = errors;
    return isValid;
  }

  private resetValidationErrors(): void {
    this.validationErrors = {};
  }

  // Actions Menu
  toggleActionsMenu(price: SubcriptionPriceViewDto, event: Event): void {
    const priceId = this.getSubcriptionPriceId(price);
    if (!priceId) return;

    event.stopPropagation();

    if (this.showActionsMenu === priceId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = priceId;
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;

      setTimeout(() => this.updateMenuPosition(priceId), 0);
    }
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuButton = null;
  }

  private updateMenuPosition(priceId: string): void {
    const menu = document.querySelector(`.actions-menu[data-price-id="${priceId}"]`) as HTMLElement;
    const button = this.currentMenuButton;

    if (!menu || !button) {
      if (!menu) {
        setTimeout(() => this.updateMenuPosition(priceId), 10);
      }
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 200;
    const menuHeight = menu.offsetHeight || 100;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;

    if (left < padding) {
      left = Math.max(padding, rect.left);
    }

    const maxLeft = viewportWidth - menuWidth - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }

    if (top + menuHeight > viewportHeight - padding) {
      top = rect.top - menuHeight - 4;
    }

    if (top < padding) {
      top = padding;
    }

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

  // Helper methods
  getSubcriptionPriceId(price: SubcriptionPriceViewDto): string | undefined {
    return (price as any).id || price.subcriptionServiceId;
  }

  getPriceStatus(price: SubcriptionPriceViewDto): string {
    if (price.isExpried) return 'Đã hết hạn';
    if (!price.isActive) return 'Chưa kích hoạt';

    const now = new Date();
    const from = price.effectiveFrom ? new Date(price.effectiveFrom) : null;
    const to = price.effectiveTo ? new Date(price.effectiveTo) : null;

    if (from && to && from <= now && to >= now) {
      return 'Đang áp dụng';
    }

    return 'Chưa đến hạn';
  }

  getPriceStatusClass(price: SubcriptionPriceViewDto): string {
    if (price.isExpried) return 'status-expired';
    if (!price.isActive) return 'status-inactive';

    const now = new Date();
    const from = price.effectiveFrom ? new Date(price.effectiveFrom) : null;
    const to = price.effectiveTo ? new Date(price.effectiveTo) : null;

    if (from && to && from <= now && to >= now) {
      return 'status-active';
    }

    return 'status-draft';
  }

  getDiscountPercent(price: SubcriptionPriceViewDto): number {
    if (price.originalPrice <= 0) return 0;
    return ((price.originalPrice - price.newPrice) / price.originalPrice) * 100;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  onBack(): void {
    this.router.navigate(['/admin/manage-service-packages']);
  }

  // Dynamic styles
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

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    const padding = 32;
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  // Helper method để lấy các khoảng thời gian đã có giá (không bao gồm giá đang edit)
  getExistingActiveRanges(): SubcriptionPriceViewDto[] {
    return this.allPrices.filter(price => {
      // Loại bỏ giá đang edit (nếu đang edit)
      if (this.selectedPrice && this.getSubcriptionPriceId(price) === this.getSubcriptionPriceId(this.selectedPrice)) {
        return false;
      }
      // Loại bỏ giá đã hết hạn
      if (price.isExpried) {
        return false;
      }
      // Chỉ lấy các giá có khoảng thời gian hợp lệ
      return price.effectiveFrom && price.effectiveTo;
    });
  }

  // Kiểm tra khoảng thời gian có bị trùng với các giá hiện có không
  private checkDateRangeOverlap(startDate: string, endDate: string): boolean {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    const existingRanges = this.getExistingActiveRanges();
    
    for (const range of existingRanges) {
      if (!range.effectiveFrom || !range.effectiveTo) continue;
      
      const existingStart = new Date(range.effectiveFrom);
      const existingEnd = new Date(range.effectiveTo);
      
      // Kiểm tra overlap:
      // Overlap xảy ra khi: newStart < existingEnd && newEnd > existingStart
      if (newStart < existingEnd && newEnd > existingStart) {
        return true; // Có trùng
      }
    }
    
    return false; // Không trùng
  }
}