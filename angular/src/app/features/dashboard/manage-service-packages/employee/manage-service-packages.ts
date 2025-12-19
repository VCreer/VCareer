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
import { Router } from '@angular/router';
import { SubcriptionService_Service } from 'src/app/proxy/services/subcription';
import { ChildService_Service } from 'src/app/proxy/services/subcription';
import { 
  SubcriptionsCreateDto, 
  SubcriptionsUpdateDto, 
  SubcriptionsViewDto,
  ChildServiceGetDto,
  ChildServiceViewDto,
  AddChildServicesDto
} from 'src/app/proxy/dto/subcriptions/models';
import { PagingDto } from 'src/app/proxy/iservices/common/models';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { 
  SubcriptionContance_SubcriptorTarget, 
  SubcriptionContance_ServiceAction
} from 'src/app/proxy/constants/job-constant';

interface GroupedChildServices {
  action: SubcriptionContance_ServiceAction;
  actionLabel: string;
  services: ChildServiceViewDto[];
  expanded: boolean;
  selectedServices: Set<string>;
}

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
  SubcriptionContance_SubcriptorTarget = SubcriptionContance_SubcriptorTarget;
  SubcriptionContance_ServiceAction = SubcriptionContance_ServiceAction;
  String = String;

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
  sortField: 'title' | 'originalPrice' | 'dayDuration' | 'target' = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  statusOptions: SelectOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' }
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
  isLoadingChildServices = false;
  isSavingChildServices = false;
  validationErrors: Record<string, string> = {};

  packageForm: SubcriptionsCreateDto = this.getDefaultPackageForm();
  packageFormTargetString: string = '';


  groupedChildServices: GroupedChildServices[] = [];
  allChildServices: ChildServiceViewDto[] = [];
  existingChildServices: ChildServiceViewDto[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private subcriptionService: SubcriptionService_Service,
    private childServiceService: ChildService_Service,
    private router: Router
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
  
  const target = this.filterType || undefined;
  
  // ✅ Convert filterStatus thành boolean hoặc undefined
  let isActive: boolean | undefined = undefined;
  if (this.filterStatus === 'true') {
    isActive = true;
  } else if (this.filterStatus === 'false') {
    isActive = false;
  }
  
  this.subcriptionService.getSubscriptionServices(target as any, isActive as any)
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

    // Search filter
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(pkg =>
        (pkg.title || '').toLowerCase().includes(keyword) ||
        (pkg.description || '').toLowerCase().includes(keyword) ||
        this.getTargetLabel(pkg.target).toLowerCase().includes(keyword)
      );
    }
    // Sort
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

  // ✅ UPDATED: Reload từ API khi filter change
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPackages(); // Gọi lại API với filter mới
  }

  onSort(field: 'title' | 'originalPrice' | 'dayDuration' | 'target'): void {
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
      this.packageForm.iShareable = false;
    } else if (target === SubcriptionContance_SubcriptorTarget.Recruiter) {
      this.packageForm.iShareable = false;
    }
  }

  onLifeTimeChange(): void {
    if (this.packageForm.isLifeTime) {
      this.packageForm.dayDuration = undefined;
      this.packageForm.isBuyLimited = true;
      this.packageForm.totalBuyEachUser = 1;
    } else {
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
      target: Number(this.packageFormTargetString) as SubcriptionContance_SubcriptorTarget
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
      originalPrice: pkg.originalPrice,
      isLimited: pkg.isLimited ?? false,  // ✅ Đảm bảo boolean
      isBuyLimited: pkg.isBuyLimited ?? false,
      iShareable: pkg.iShareable ?? false,
      totalLimitpackage: pkg.totalLimitpackage,
      totalBuyEachUser: pkg.totalBuyEachUser ?? 0,
      isLifeTime: pkg.isLifeTime ?? false,
      dayDuration: pkg.dayDuration,
      isActive: pkg.isActive ?? false
    };
    this.packageFormTargetString = String(pkg.target);
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
    this.loadChildServices();
    this.closeActionsMenu();
  }

  onManagePrices(pkg: SubcriptionsViewDto): void {
    this.router.navigate(['/employee/service-price-list', pkg.id]);
    this.closeActionsMenu();
  }

  loadChildServices(): void {
    if (!this.selectedPackage?.id) return;

    this.isLoadingChildServices = true;
    
    const getDto: ChildServiceGetDto = {
      isActive: true,
      pagingDto: {
        skipCount: 0,
        maxResultCount: 1000
      } as unknown as PagingDto
    };

    const allServices$ = this.childServiceService.getChildServices(getDto);
    const existingServices$ = this.subcriptionService.getChildServicesBySubcriptionIdAndIsActive(
      this.selectedPackage.id,
      true
    );

    forkJoin({
      allServices: allServices$,
      existingServices: existingServices$
    })
      .pipe(finalize(() => {
        this.isLoadingChildServices = false;
      }))
      .subscribe({
        next: (result) => {
          this.allChildServices = result.allServices;
          this.existingChildServices = result.existingServices;
          this.groupServicesByAction();
        },
        error: (error) => {
          console.error('Error loading child services:', error);
          this.showToastMessage('Không thể tải danh sách dịch vụ con', 'error');
          this.allChildServices = [];
          this.existingChildServices = [];
          this.groupedChildServices = [];
        }
      });
  }

  groupServicesByAction(): void {
    const grouped = new Map<SubcriptionContance_ServiceAction, ChildServiceViewDto[]>();

    this.allChildServices.forEach(service => {
      if (service.action !== undefined) {
        if (!grouped.has(service.action)) {
          grouped.set(service.action, []);
        }
        grouped.get(service.action)!.push(service);
      }
    });

    const existingServiceIds = new Set(
      this.existingChildServices
        .map(s => s.id)
        .filter((id): id is string => id !== undefined)
    );

    this.groupedChildServices = Array.from(grouped.entries()).map(([action, services]) => {
      const selectedServices = new Set<string>();
      
      services.forEach(service => {
        if (service.id && existingServiceIds.has(service.id)) {
          selectedServices.add(service.id);
        }
      });

      return {
        action,
        actionLabel: this.getServiceActionLabel(action),
        services,
        expanded: false,
        selectedServices
      };
    });
  }

  toggleActionGroup(group: GroupedChildServices): void {
    group.expanded = !group.expanded;
  }

  toggleServiceSelection(group: GroupedChildServices, serviceId: string | undefined): void {
    if (!serviceId) return;

    if (group.selectedServices.has(serviceId)) {
      group.selectedServices.delete(serviceId);
    } else {
      group.selectedServices.add(serviceId);
    }
  }

  isServiceSelected(group: GroupedChildServices, serviceId: string | undefined): boolean {
    if (!serviceId) return false;
    return group.selectedServices.has(serviceId);
  }

  getSelectedServicesCount(group: GroupedChildServices): number {
    return group.selectedServices.size;
  }

  getTotalSelectedServices(): number {
    return this.groupedChildServices.reduce((total, group) => total + group.selectedServices.size, 0);
  }

  onConfirmAttachChildServices(): void {
    if (this.isSavingChildServices || !this.selectedPackage) {
      return;
    }

    const allSelectedIds: string[] = [];
    this.groupedChildServices.forEach(group => {
      group.selectedServices.forEach(id => allSelectedIds.push(id));
    });

    if (allSelectedIds.length === 0) {
      this.showToastMessage('Vui lòng chọn ít nhất một dịch vụ con', 'warning');
      return;
    }

    this.isSavingChildServices = true;

    const addDto: AddChildServicesDto = {
      subcriptionId: this.selectedPackage.id,
      childServiceIds: allSelectedIds
    };

    this.subcriptionService.addChildService(addDto)
      .pipe(finalize(() => {
        setTimeout(() => (this.isSavingChildServices = false), 250);
      }))
      .subscribe({
        next: () => {
          this.showToastMessage('Gắn dịch vụ con thành công', 'success');
          this.showManageChildServicesModal = false;
          this.loadPackages();
        },
        error: (error) => {
          console.error('Error attaching child services:', error);
          const errorMsg = error?.error?.error?.message || 'Không thể gắn dịch vụ con';
          this.showToastMessage(errorMsg, 'error');
        }
      });
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

    if (this.packageForm.originalPrice < 0) {
      errors['originalPrice'] = 'Giá gốc phải lớn hơn hoặc bằng 0';
      isValid = false;
    }

    if (!this.packageForm.isLifeTime && (!this.packageForm.dayDuration || this.packageForm.dayDuration <= 0)) {
      errors['dayDuration'] = 'Vui lòng nhập số ngày hợp lệ';
      isValid = false;
    }

    if (this.packageForm.isBuyLimited && this.packageForm.totalBuyEachUser <= 0) {
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

  // ✅ UPDATED: Thêm labels cho target mới
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

  getServiceActionLabel(action: SubcriptionContance_ServiceAction): string {
    const labels: { [key: number]: string } = {
      [SubcriptionContance_ServiceAction.BoostScoreJob]: 'Tăng điểm tin tuyển dụng',
      [SubcriptionContance_ServiceAction.TopList]: 'Đẩy tin lên đầu',
      [SubcriptionContance_ServiceAction.JobBadge]: 'Huy hiệu tin tuyển dụng',
      [SubcriptionContance_ServiceAction.ThemeCompany]: 'Giao diện công ty'
    };
    return labels[action] || 'Không xác định';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getDurationLabel(pkg: SubcriptionsViewDto): string {
    if (pkg.isLifeTime) return 'Vĩnh viễn';
    if (pkg.dayDuration && pkg.dayDuration > 0) return `${pkg.dayDuration} ngày`;
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