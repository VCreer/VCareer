import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  StatusDropdownComponent,
  StatusOption,
  SelectOption
} from '../../../../shared/components';
import { SubcriptionService_Service } from 'src/app/proxy/services/subcription';
import { 
  SubcriptionsCreateDto, 
  SubcriptionsUpdateDto, 
  SubcriptionsViewDto 
} from 'src/app/proxy/dto/subcriptions/models';
import { finalize } from 'rxjs/operators';
import { 
  SubcriptionContance_SubcriptorTarget, 
  SubcriptionContance_SubcriptionStatus 
} from 'src/app/proxy/constants/job-constant';

@Component({
  selector: 'app-manage-service-packages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    InputFieldComponent,
    SelectFieldComponent,
    PaginationComponent,
    GenericModalComponent,
    StatusDropdownComponent
  ],
  templateUrl: './manage-service-packages.html',
  styleUrls: ['./manage-service-packages.scss']
})
export class ManageServicePackagesComponent implements OnInit, OnDestroy {
  // Expose enums to template
  SubcriptionContance_SubcriptorTarget = SubcriptionContance_SubcriptorTarget;
  SubcriptionContance_SubcriptionStatus = SubcriptionContance_SubcriptionStatus;
  String = String; // Expose String constructor to template

  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  allPackages: SubcriptionsViewDto[] = [];
  filteredPackages: SubcriptionsViewDto[] = [];
  paginatedPackages: SubcriptionsViewDto[] = [];

  searchKeyword = '';
  filterStatus: string = '';
  filterType: string = '';
  sortField: 'title' | 'originalPrice' | 'dayDuration' | 'target' | 'status' = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  statusOptions: StatusOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: String(SubcriptionContance_SubcriptionStatus.Active), label: 'Đang hoạt động' },
    { value: String(SubcriptionContance_SubcriptionStatus.Inactive), label: 'Ngừng hoạt động' },
    { value: String(SubcriptionContance_SubcriptionStatus.Expired), label: 'Hết hạn' },
    { value: String(SubcriptionContance_SubcriptionStatus.Cancelled), label: 'Đã hủy' }
  ];

  // Chỉ cho phép chọn Active và Inactive khi tạo/sửa
  createStatusOptions: SelectOption[] = [
    { value: String(SubcriptionContance_SubcriptionStatus.Inactive), label: 'Chưa hoạt động' },
    { value: String(SubcriptionContance_SubcriptionStatus.Active), label: 'Đang hoạt động' }
  ];

  typeOptions: SelectOption[] = [
    { value: '', label: 'Tất cả đối tượng' },
    { value: String(SubcriptionContance_SubcriptorTarget.Candidate), label: 'Ứng viên' },
    { value: String(SubcriptionContance_SubcriptorTarget.Recruiter), label: 'Nhà tuyển dụng' }
  ];

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  showActionsMenu: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  showCreatePackageModal = false;
  showEditPackageModal = false;
  showManageChildServicesModal = false;
  selectedPackage: SubcriptionsViewDto | null = null;

  isLoadingPackages = false;
  isSavingPackage = false;
  isSavingPackageEdit = false;
  validationErrors: Record<string, string> = {};

  // Package Form
  packageForm: SubcriptionsCreateDto = this.getDefaultPackageForm();
  
  // String bindings for select fields
  packageFormTargetString: string = '';
  packageFormStatusString: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
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

    this.loadPackages();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private getDefaultPackageForm(): SubcriptionsCreateDto {
    return {
      title: '',
      description: '',
      target: SubcriptionContance_SubcriptorTarget.Recruiter,
      status: SubcriptionContance_SubcriptionStatus.Inactive,
      originalPrice: 0,
      isLimited: false,
      isBuyLimited: false,
      iShareable: false,
      totalLimitpackage: undefined,
      totalBuyEachUser: 0,
      isLifeTime: false,
      dayDuration: undefined,
      isActive: false
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

  loadPackages(): void {
    this.isLoadingPackages = true;
    
    this.subcriptionService.getActiveSubscriptionServices(undefined)
      .pipe(finalize(() => {
        this.isLoadingPackages = false;
      }))
      .subscribe({
        next: (response: SubcriptionsViewDto[]) => {
          this.allPackages = response;
          this.applyFilters();
          this.showToastMessage('Tải danh sách gói dịch vụ thành công', 'success');
        },
        error: (error) => {
          console.error('Error loading packages:', error);
          this.showToastMessage('Không thể tải danh sách gói dịch vụ', 'error');
          this.allPackages = [];
          this.applyFilters();
        }
      });
  }

  applyFilters(): void {
    let result = [...this.allPackages];

    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(pkg =>
        (pkg.title || '').toLowerCase().includes(keyword) ||
        (pkg.description || '').toLowerCase().includes(keyword) ||
        this.getTargetLabel(pkg.target).toLowerCase().includes(keyword)
      );
    }

    if (this.filterStatus) {
      result = result.filter(p => p.status === Number(this.filterStatus));
    }

    if (this.filterType) {
      result = result.filter(p => p.target === Number(this.filterType));
    }

    result.sort((a, b) => {
      let aValue: any = a[this.sortField];
      let bValue: any = b[this.sortField];

      if (this.sortField === 'title') {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredPackages = result;
    this.totalPages = Math.ceil(this.filteredPackages.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedPackages = this.filteredPackages.slice(start, end);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: 'title' | 'originalPrice' | 'dayDuration' | 'target' | 'status'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  // CRUD Actions
  onCreatePackage(): void {
    this.resetPackageForm();
    this.resetValidationErrors();
    this.showCreatePackageModal = true;
  }

  onTargetChange(): void {
    if (!this.packageFormTargetString) {
      return;
    }

    const target = Number(this.packageFormTargetString) as SubcriptionContance_SubcriptorTarget;
    
    if (target === SubcriptionContance_SubcriptorTarget.Candidate) {
      // Candidate: iShareable = false
      this.packageForm.iShareable = false;
    } else if (target === SubcriptionContance_SubcriptorTarget.Recruiter) {
      // Recruiter: Có thể tùy chỉnh
      this.packageForm.iShareable = false;
    }
  }

  onLifeTimeChange(): void {
    if (this.packageForm.isLifeTime) {
      // isLifeTime = true -> dayDuration = undefined, isBuyLimited = true, totalBuyEachUser = 1 (locked)
      this.packageForm.dayDuration = undefined;
      this.packageForm.isBuyLimited = true;
      this.packageForm.totalBuyEachUser = 1;
    } else {
      // isLifeTime = false -> có thể nhập dayDuration
      this.packageForm.dayDuration = undefined;
      this.packageForm.isBuyLimited = false;
      this.packageForm.totalBuyEachUser = 0;
    }
  }

  onIsLimitedChange(): void {
    if (!this.packageForm.isLimited) {
      this.packageForm.totalLimitpackage = undefined;
    }
  }

  resetPackageForm(): void {
    this.packageForm = this.getDefaultPackageForm();
    this.packageFormTargetString = String(SubcriptionContance_SubcriptorTarget.Recruiter);
    this.packageFormStatusString = String(SubcriptionContance_SubcriptionStatus.Inactive);
    this.selectedPackage = null;
    this.resetValidationErrors();
  }

  onConfirmCreatePackage(): void {
    if (this.isSavingPackage) {
      return;
    }

    if (!this.validatePackageForm()) {
      return;
    }

    this.isSavingPackage = true;

    const createDto: SubcriptionsCreateDto = {
      ...this.packageForm,
      target: Number(this.packageFormTargetString) as SubcriptionContance_SubcriptorTarget,
      status: Number(this.packageFormStatusString) as SubcriptionContance_SubcriptionStatus
    };

    this.subcriptionService.createSubCription(createDto)
      .pipe(finalize(() => {
        setTimeout(() => (this.isSavingPackage = false), 250);
      }))
      .subscribe({
        next: () => {
          this.showToastMessage('Tạo gói dịch vụ thành công', 'success');
          this.showCreatePackageModal = false;
          this.loadPackages();
        },
        error: (error) => {
          console.error('Error creating package:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể tạo gói dịch vụ';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onEditPackage(pkg: SubcriptionsViewDto): void {
    this.selectedPackage = pkg;
    this.packageForm = {
      title: pkg.title,
      description: pkg.description,
      target: pkg.target,
      status: pkg.status,
      originalPrice: pkg.originalPrice,
      isLimited: pkg.isLimited,
      isBuyLimited: pkg.isBuyLimited,
      iShareable: false,
      totalLimitpackage: undefined,
      totalBuyEachUser: pkg.totalBuyEachUser,
      isLifeTime: pkg.isLifeTime,
      dayDuration: pkg.dayDuration,
      isActive: pkg.isActive
    };
    this.packageFormTargetString = String(pkg.target);
    this.packageFormStatusString = String(pkg.status);
    this.resetValidationErrors();
    this.showEditPackageModal = true;
    this.closeActionsMenu();
  }

  onConfirmEditPackage(): void {
    if (this.isSavingPackageEdit || !this.selectedPackage) {
      return;
    }

    if (!this.validatePackageForm()) {
      return;
    }

    this.isSavingPackageEdit = true;

    const updateDto: SubcriptionsUpdateDto = {
      subcriptionId: this.selectedPackage.id,
      title: this.packageForm.title,
      description: this.packageForm.description,
      isActive: this.packageForm.isActive,
      dayDuration: this.packageForm.isLifeTime ? undefined : this.packageForm.dayDuration
    };

    this.subcriptionService.updateSubcription(updateDto)
      .pipe(finalize(() => {
        setTimeout(() => (this.isSavingPackageEdit = false), 250);
      }))
      .subscribe({
        next: () => {
          this.showToastMessage('Cập nhật gói dịch vụ thành công', 'success');
          this.showEditPackageModal = false;
          this.selectedPackage = null;
          this.loadPackages();
        },
        error: (error) => {
          console.error('Error updating package:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể cập nhật gói dịch vụ';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onManageChildServices(pkg: SubcriptionsViewDto): void {
    this.selectedPackage = pkg;
    this.showManageChildServicesModal = true;
    this.showToastMessage('Chức năng gắn dịch vụ con đang được phát triển', 'info');
    this.closeActionsMenu();
  }

  onToggleActive(pkg: SubcriptionsViewDto): void {
    const newIsActive = !pkg.isActive;
    
    const updateDto: SubcriptionsUpdateDto = {
      subcriptionId: pkg.id,
      title: pkg.title,
      description: pkg.description,
      isActive: newIsActive,
      dayDuration: pkg.dayDuration
    };

    this.subcriptionService.updateSubcription(updateDto)
      .subscribe({
        next: () => {
          this.showToastMessage(
            newIsActive ? 'Đã kích hoạt gói dịch vụ' : 'Đã vô hiệu hóa gói dịch vụ',
            'success'
          );
          this.loadPackages();
        },
        error: (error) => {
          console.error('Error toggling package status:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể thay đổi trạng thái gói dịch vụ';
          this.showToastMessage(errorMsg, 'error');
        }
      });
    
    this.closeActionsMenu();
  }

  onDeletePackage(pkg: SubcriptionsViewDto): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${pkg.title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    this.subcriptionService.deleteSubcription(pkg.id!)
      .subscribe({
        next: () => {
          this.showToastMessage('Đã xóa gói dịch vụ', 'success');
          this.loadPackages();
        },
        error: (error) => {
          console.error('Error deleting package:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể xóa gói dịch vụ';
          this.showToastMessage(errorMsg, 'error');
        }
      });
    
    this.closeActionsMenu();
  }

  private validatePackageForm(): boolean {
    this.resetValidationErrors();
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!this.packageForm.title || !this.packageForm.title.trim()) {
      errors['title'] = 'Vui lòng nhập tên gói dịch vụ';
      isValid = false;
    }

    if (!this.packageForm.description || !this.packageForm.description.trim()) {
      errors['description'] = 'Vui lòng nhập mô tả gói dịch vụ';
      isValid = false;
    }

    if (this.packageForm.originalPrice === null || this.packageForm.originalPrice === undefined || this.packageForm.originalPrice < 0) {
      errors['originalPrice'] = 'Giá gốc phải lớn hơn hoặc bằng 0';
      isValid = false;
    }

    if (!this.packageForm.isLifeTime && (!this.packageForm.dayDuration || this.packageForm.dayDuration <= 0)) {
      errors['dayDuration'] = 'Vui lòng nhập số ngày hợp lệ';
      isValid = false;
    }

    if (this.packageForm.isBuyLimited && (!this.packageForm.totalBuyEachUser || this.packageForm.totalBuyEachUser <= 0)) {
      errors['totalBuyEachUser'] = 'Vui lòng nhập số lượng tối đa mua của mỗi cá nhân';
      isValid = false;
    }

    if (this.packageForm.isLimited && (!this.packageForm.totalLimitpackage || this.packageForm.totalLimitpackage <= 0)) {
      errors['totalLimitpackage'] = 'Vui lòng nhập tổng số lượng gói giới hạn';
      isValid = false;
    }

    this.validationErrors = errors;
    return isValid;
  }

  private resetValidationErrors(): void {
    this.validationErrors = {};
  }

  // Actions Menu
  toggleActionsMenu(itemId: string | undefined, event: Event): void {
    if (!itemId) return;
    
    event.stopPropagation();
    
    if (this.showActionsMenu === itemId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = itemId;
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;
      
      setTimeout(() => this.updateMenuPosition(itemId), 0);
    }
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuButton = null;
  }

  private updateMenuPosition(packageId: string): void {
    const menu = document.querySelector(`.actions-menu[data-package-id="${packageId}"]`) as HTMLElement;
    const button = this.currentMenuButton;
    
    if (!menu || !button) {
      if (!menu) {
        setTimeout(() => this.updateMenuPosition(packageId), 10);
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
  getStatusLabel(pkg: SubcriptionsViewDto): string {
    const labels: { [key: number]: string } = {
      [SubcriptionContance_SubcriptionStatus.Active]: 'Đang hoạt động',
      [SubcriptionContance_SubcriptionStatus.Inactive]: 'Ngừng hoạt động',
      [SubcriptionContance_SubcriptionStatus.Expired]: 'Hết hạn',
      [SubcriptionContance_SubcriptionStatus.Cancelled]: 'Đã hủy'
    };
    return labels[pkg.status!] || 'Không xác định';
  }

  getStatusClass(pkg: SubcriptionsViewDto): string {
    const classes: { [key: number]: string } = {
      [SubcriptionContance_SubcriptionStatus.Active]: 'status-active',
      [SubcriptionContance_SubcriptionStatus.Inactive]: 'status-inactive',
      [SubcriptionContance_SubcriptionStatus.Expired]: 'status-draft',
      [SubcriptionContance_SubcriptionStatus.Cancelled]: 'status-inactive'
    };
    return classes[pkg.status!] || 'status-inactive';
  }

  getTargetLabel(target: SubcriptionContance_SubcriptorTarget | undefined): string {
    if (target === undefined) return 'Không xác định';
    const labels: { [key: number]: string } = {
      [SubcriptionContance_SubcriptorTarget.Candidate]: 'Ứng viên',
      [SubcriptionContance_SubcriptorTarget.Recruiter]: 'Nhà tuyển dụng'
    };
    return labels[target] || 'Không xác định';
  }

  getTargetClass(target: SubcriptionContance_SubcriptorTarget | undefined): string {
    if (target === undefined) return '';
    const classes: { [key: number]: string } = {
      [SubcriptionContance_SubcriptorTarget.Candidate]: 'target-candidate',
      [SubcriptionContance_SubcriptorTarget.Recruiter]: 'target-recruiter'
    };
    return classes[target] || '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getDurationLabel(pkg: SubcriptionsViewDto): string {
    if (pkg.isLifeTime) return 'Vĩnh viễn';
    if (pkg.dayDuration) return `${pkg.dayDuration} ngày`;
    return '-';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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

  // Dynamic styles for responsive layout
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