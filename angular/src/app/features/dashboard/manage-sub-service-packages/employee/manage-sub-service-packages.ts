import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { 
  ButtonComponent, 
  ToastNotificationComponent,
  InputFieldComponent,
  SelectFieldComponent,
  PaginationComponent,
  GenericModalComponent,
  StatusDropdownComponent,
  StatusOption,
  SelectOption,
  ToggleSwitchComponent
} from '../../../../shared/components';
import { ChildService_Service } from '../../../../proxy/services/subcription/child-service-.service';
import { 
  ChildServiceCreateDto, 
  ChildServiceViewDto, 
  ChildServiceGetDto,
  ChildServiceUpdateDto 
} from '../../../../proxy/dto/subcriptions/models';
import { SubcriptionContance_ServiceAction } from '../../../../proxy/constants/job-constant/subcription-contance-service-action.enum';
import { SubcriptionContance_ServiceTarget } from '../../../../proxy/constants/job-constant/subcription-contance-service-target.enum';
import { JobPriorityLevel, jobPriorityLevelOptions } from '../../../../proxy/constants/job-constant/job-priority-level.enum';

@Component({
  selector: 'app-manage-sub-service-packages',
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
    StatusDropdownComponent,
    ToggleSwitchComponent
  ],
  templateUrl: './manage-sub-service-packages.html',
  styleUrls: ['./manage-sub-service-packages.scss']
})
export class ManageSubServicePackagesComponent implements OnInit, OnDestroy {
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isDeleting = false;

  allChildServices: ChildServiceViewDto[] = [];
  filteredChildServices: ChildServiceViewDto[] = [];
  paginatedChildServices: ChildServiceViewDto[] = [];

  searchKeyword = '';
  filterAction: string = '';
  filterTarget: string = '';
  filterStatus = '';
  sortField: 'name' | 'action' | 'target' | 'isActive' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  statusOptions: StatusOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  actionOptions: SelectOption[] = [
    { value: '', label: 'Tất cả hành động' }
  ];

  targetOptions: SelectOption[] = [
    { value: '', label: 'Tất cả đối tượng' },
    { value: String(SubcriptionContance_ServiceTarget.JobPost), label: 'Tin tuyển dụng' },
 //   { value: String(SubcriptionContance_ServiceTarget.Company), label: 'Công ty' }
  ];

  formTargetOptions: SelectOption[] = [];
  formActionOptions: SelectOption[] = [];
  formPriorityOptions: SelectOption[] = [];

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  showCreateModal = false;
  showEditModal = false;
  selectedChildService: ChildServiceViewDto | null = null;

  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;

  createForm: ChildServiceCreateDto = this.getDefaultCreateForm();
  createFormActionString: string = '';
  createFormTargetString: string = '';
  createFormPriorityString: string = '';

  editForm: ChildServiceUpdateDto = {
    cHildServiceId: '',
    name: '',
    description: '',
    isActive: true
  };

  // Các trường được khóa dựa trên action
  isFieldLocked = {
    isLifeTime: false,
    isLimitUsedTime: false,
    isAutoActive: false,
    priority: false,
    timeUsedLimit: false
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private childServiceService: ChildService_Service
  ) {}

  ngOnInit(): void {
    this.initializeFormOptions();
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

    this.loadChildServices();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initializeFormOptions(): void {
    this.formTargetOptions = [
      { value: '', label: 'Chọn đối tượng' },
      { value: String(SubcriptionContance_ServiceTarget.JobPost), label: 'Tin tuyển dụng' },
   //   { value: String(SubcriptionContance_ServiceTarget.Company), label: 'Công ty' }
    ];

    this.formPriorityOptions = [
      { value: '', label: 'Chọn mức độ ưu tiên' },
      ...jobPriorityLevelOptions.map(opt => ({
        value: String(opt.value),
        label: this.getPriorityLabel(opt.value as JobPriorityLevel)
      }))
    ];

    this.formActionOptions = [
      { value: '', label: 'Chọn hành động' }
    ];

    this.actionOptions = [
      { value: '', label: 'Tất cả hành động' },
      { value: String(SubcriptionContance_ServiceAction.BoostScoreJob), label: 'Tăng điểm Job' },
  //    { value: String(SubcriptionContance_ServiceAction.TopList), label: 'Top danh sách' },
    //  { value: String(SubcriptionContance_ServiceAction.JobBadge), label: 'Badge Job' },
    //  { value: String(SubcriptionContance_ServiceAction.ThemeCompany), label: 'Theme công ty' }
    ];
  }

  private getDefaultCreateForm(): ChildServiceCreateDto {
    return {
      name: '',
      description: '',
      action: undefined,
      target: undefined,
      isActive: true,
      isEnable: true,
      isLifeTime: false,
      isAutoActive: false,
      isLimitUsedTime: false,
      priority: undefined,
      timeUsedLimit: undefined,
      dayDuration: undefined,
      value: undefined
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

  loadChildServices(): void {
    this.isLoading = true;
    const dto: ChildServiceGetDto = {
      pagingDto: {
        pageSize: 1000,
        pageIndex: 0
      },
      serviceAction: undefined,
      target: undefined,
      isActive: undefined
    };

    this.childServiceService.getChildServices(dto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (childServices: ChildServiceViewDto[]) => {
          this.allChildServices = childServices;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading child services:', err);
          this.showToastMessage('Không thể tải danh sách dịch vụ con', 'error');
          this.allChildServices = [];
          this.applyFilters();
        }
      });
  }

  applyFilters(): void {
    let result = [...this.allChildServices];

    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(cs =>
        (cs.name || '').toLowerCase().includes(keyword) ||
        (cs.description || '').toLowerCase().includes(keyword)
      );
    }

    if (this.filterAction) {
      result = result.filter(cs => cs.action === Number(this.filterAction));
    }

    if (this.filterTarget) {
      result = result.filter(cs => cs.target === Number(this.filterTarget));
    }

    if (this.filterStatus) {
      if (this.filterStatus === 'active') {
        result = result.filter(cs => cs.isActive);
      } else if (this.filterStatus === 'inactive') {
        result = result.filter(cs => !cs.isActive);
      }
    }

    result.sort((a, b) => {
      let aValue: any = a[this.sortField];
      let bValue: any = b[this.sortField];

      if (this.sortField === 'name') {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredChildServices = result;
    this.totalPages = Math.ceil(this.filteredChildServices.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedChildServices = this.filteredChildServices.slice(start, end);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: 'name' | 'action' | 'target' | 'isActive'): void {
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
  onCreateChildService(): void {
    this.createForm = this.getDefaultCreateForm();
    this.createFormActionString = '';
    this.createFormTargetString = '';
    this.createFormPriorityString = '';
    this.resetFieldLocks();
    this.showCreateModal = true;
  }

  onTargetChange(): void {
    this.createFormActionString = '';
    this.createForm.action = undefined;
    this.resetFieldLocks();

    if (!this.createFormTargetString) {
      this.formActionOptions = [
        { value: '', label: 'Chọn hành động' }
      ];
      return;
    }

    const target = Number(this.createFormTargetString);

    if (target === SubcriptionContance_ServiceTarget.JobPost) {
      this.formActionOptions = [
        { value: '', label: 'Chọn hành động' },
        { value: String(SubcriptionContance_ServiceAction.BoostScoreJob), label: 'Tăng điểm Job' },
      //  { value: String(SubcriptionContance_ServiceAction.TopList), label: 'Top danh sách' },
     //   { value: String(SubcriptionContance_ServiceAction.JobBadge), label: 'Badge Job' }
      ];
    } else if (target === SubcriptionContance_ServiceTarget.Company) {
      this.formActionOptions = [
        { value: '', label: 'Chọn hành động' },
 //       { value: String(SubcriptionContance_ServiceAction.ThemeCompany), label: 'Theme công ty' }
      ];
    } else {
      this.formActionOptions = [
        { value: '', label: 'Chọn hành động' }
      ];
    }
  }

  onActionChange(): void {
    if (!this.createFormActionString) {
      this.resetFieldLocks();
      return;
    }

    const action = Number(this.createFormActionString) as SubcriptionContance_ServiceAction;
    this.applyActionRules(action);
  }

  private applyActionRules(action: SubcriptionContance_ServiceAction): void {
    this.resetFieldLocks();

    switch (action) {
      case SubcriptionContance_ServiceAction.BoostScoreJob:
      case SubcriptionContance_ServiceAction.TopList:
        this.createForm.isLifeTime = false;
        this.createForm.isLimitUsedTime = true;
        this.createForm.isAutoActive = false;
        this.createForm.target = SubcriptionContance_ServiceTarget.JobPost;
        
        this.isFieldLocked.isLifeTime = true;
        this.isFieldLocked.isLimitUsedTime = true;
        this.isFieldLocked.isAutoActive = true;
        break;

      case SubcriptionContance_ServiceAction.JobBadge:
        this.createForm.isLifeTime = false;
        this.createForm.isLimitUsedTime = true;
        this.createForm.isAutoActive = false;
        this.createForm.target = SubcriptionContance_ServiceTarget.JobPost;
        this.createForm.priority = undefined;
        this.createFormPriorityString = '';
        
        this.isFieldLocked.isLifeTime = true;
        this.isFieldLocked.isLimitUsedTime = true;
        this.isFieldLocked.isAutoActive = true;
        this.isFieldLocked.priority = true;
        break;

      case SubcriptionContance_ServiceAction.ThemeCompany:
        this.createForm.isLifeTime = false;
        this.createForm.isLimitUsedTime = false;
        this.createForm.isAutoActive = true;
        this.createForm.target = SubcriptionContance_ServiceTarget.Company;
        this.createForm.timeUsedLimit = undefined;
        this.createForm.priority = undefined;
        this.createFormPriorityString = '';
        
        this.isFieldLocked.isLifeTime = true;
        this.isFieldLocked.isLimitUsedTime = true;
        this.isFieldLocked.isAutoActive = true;
        this.isFieldLocked.priority = true;
        this.isFieldLocked.timeUsedLimit = true;
        break;
    }
  }

  private resetFieldLocks(): void {
    this.isFieldLocked = {
      isLifeTime: false,
      isLimitUsedTime: false,
      isAutoActive: false,
      priority: false,
      timeUsedLimit: false
    };
  }

  onConfirmCreate(): void {
    if (!this.createForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên dịch vụ', 'error');
      return;
    }

    if (!this.createFormTargetString) {
      this.showToastMessage('Vui lòng chọn đối tượng', 'error');
      return;
    }

    if (!this.createFormActionString) {
      this.showToastMessage('Vui lòng chọn hành động', 'error');
      return;
    }

    if (this.createForm.isLifeTime && this.createForm.timeUsedLimit && this.createForm.timeUsedLimit > 0) {
      this.showToastMessage('Không thể có giới hạn số lần dùng khi là vĩnh viễn', 'error');
      return;
    }

    if (!this.createForm.isLifeTime && (!this.createForm.timeUsedLimit || this.createForm.timeUsedLimit <= 0)) {
      this.showToastMessage('Cần có giới hạn số lần dùng khi không phải vĩnh viễn', 'error');
      return;
    }

    if (this.createForm.dayDuration && this.createForm.dayDuration < 0) {
      this.showToastMessage('Số ngày phải lớn hơn 0', 'error');
      return;
    }

    if (this.createForm.timeUsedLimit && this.createForm.timeUsedLimit < 0) {
      this.showToastMessage('Số lần dùng phải lớn hơn 0', 'error');
      return;
    }

    if (this.isCreating) return;

    this.isCreating = true;
    const dto: ChildServiceCreateDto = {
      name: this.createForm.name,
      description: this.createForm.description,
      action: Number(this.createFormActionString) as SubcriptionContance_ServiceAction,
      target: Number(this.createFormTargetString) as SubcriptionContance_ServiceTarget,
      isActive: this.createForm.isActive,
      isEnable: this.createForm.isEnable,
      isLifeTime: this.createForm.isLifeTime,
      isAutoActive: this.createForm.isAutoActive,
      isLimitUsedTime: this.createForm.isLimitUsedTime,
      priority: this.createFormPriorityString ? (Number(this.createFormPriorityString) as JobPriorityLevel) : undefined,
      timeUsedLimit: this.createForm.isLimitUsedTime ? this.createForm.timeUsedLimit : undefined,
      dayDuration: !this.createForm.isLifeTime ? this.createForm.dayDuration : undefined,
      value: this.createForm.value
    };

    this.childServiceService.createChildService(dto)
      .pipe(finalize(() => this.isCreating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Tạo dịch vụ con thành công', 'success');
          this.showCreateModal = false;
          this.loadChildServices();
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Tạo dịch vụ con thất bại';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onEditChildService(childService: ChildServiceViewDto): void {
    this.selectedChildService = childService;
    this.editForm = {
      cHildServiceId: childService.id,
      name: childService.name,
      description: childService.description,
      isActive: childService.isActive
    };
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onConfirmEdit(): void {
    if (!this.selectedChildService || !this.editForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên dịch vụ', 'error');
      return;
    }

    if (this.isUpdating) return;

    this.isUpdating = true;
    this.childServiceService.updateChildService(this.editForm)
      .pipe(finalize(() => this.isUpdating = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Cập nhật dịch vụ con thành công', 'success');
          this.showEditModal = false;
          this.selectedChildService = null;
          this.loadChildServices();
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Cập nhật dịch vụ con thất bại';
          this.showToastMessage(errorMsg, 'error');
        }
      });
  }

  onDeleteChildService(childService: ChildServiceViewDto): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa dịch vụ con "${childService.name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    if (this.isDeleting) return;

    this.isDeleting = true;
    this.childServiceService.deleteChildService(childService.id!)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.showToastMessage('Đã xóa dịch vụ con', 'success');
          this.loadChildServices();
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Xóa dịch vụ con thất bại';
          this.showToastMessage(errorMsg, 'error');
        }
      });
    
    this.closeActionsMenu();
  }

  onToggleActive(childService: ChildServiceViewDto): void {
    const newStatus = !childService.isActive;
    
    this.childServiceService.setStatusChildService(childService.id!, newStatus)
      .subscribe({
        next: () => {
          childService.isActive = newStatus;
          this.applyFilters();
          this.showToastMessage(
            newStatus ? 'Đã kích hoạt dịch vụ con' : 'Đã vô hiệu hóa dịch vụ con',
            'success'
          );
        },
        error: (err) => {
          const errorMsg = err?.error?.error?.message || 'Không thể thay đổi trạng thái';
          this.showToastMessage(errorMsg, 'error');
        }
      });
    
    this.closeActionsMenu();
  }

  // Actions Menu
  toggleActionsMenu(childServiceId: string, event: Event): void {
    event.stopPropagation();
    
    const isOpening = this.showActionsMenu !== childServiceId;
    this.showActionsMenu = isOpening ? childServiceId : null;
    
    if (isOpening) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      this.updateMenuPosition(rect);
    } else {
      this.menuPosition = null;
    }
  }

  private closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.menuPosition = null;
  }

  private updateMenuPosition(buttonRect: DOMRect) {
    if (!this.showActionsMenu) return;
    
    const menu = document.querySelector(`.actions-menu[data-child-service-id="${this.showActionsMenu}"]`) as HTMLElement;
    if (!menu) {
      setTimeout(() => this.updateMenuPosition(buttonRect), 10);
      return;
    }
    
    const menuWidth = menu.offsetWidth || 200;
    const menuHeight = menu.offsetHeight || 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;
    
    const sidebarWidth = this.getSidebarWidth();
    const padding = isMobile ? 16 : 24;
    const paddingLeft = sidebarWidth + padding;
    
    const menuGap = 8;
    let menuLeft = buttonRect.right + menuGap;
    
    const spaceOnRight = viewportWidth - buttonRect.right;
    if (spaceOnRight < menuWidth) {
      menuLeft = buttonRect.left - menuWidth - menuGap;
      
      if (menuLeft < paddingLeft) {
        menuLeft = paddingLeft;
      }
    }
    
    if (menuLeft + menuWidth > viewportWidth - padding) {
      menuLeft = Math.max(paddingLeft, viewportWidth - menuWidth - padding);
    }
    
    if (menuLeft < paddingLeft) {
      menuLeft = paddingLeft;
    }
    
    const breadcrumbBox = document.querySelector('.breadcrumb-box') as HTMLElement;
    const breadcrumbBottom = breadcrumbBox ? breadcrumbBox.getBoundingClientRect().bottom : 120;
    
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top - breadcrumbBottom;
    
    let top = buttonRect.bottom + menuGap;
    
    if (top < breadcrumbBottom + menuGap) {
      top = breadcrumbBottom + menuGap;
    }
    
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      top = buttonRect.top - menuHeight - menuGap;
      
      if (top < breadcrumbBottom + menuGap) {
        top = breadcrumbBottom + menuGap;
      }
    }
    
    if (top < breadcrumbBottom + menuGap) {
      top = breadcrumbBottom + menuGap;
    }
    if (top + menuHeight > viewportHeight) {
      top = Math.max(breadcrumbBottom + menuGap, viewportHeight - menuHeight - menuGap);
    }
    
    this.menuPosition = {
      top: top,
      left: menuLeft,
      maxWidth: menuWidth
    };
    this.cdr.detectChanges();
  }

  private getSidebarWidth(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return 0;
    
    const container = document.querySelector('.manage-sub-service-packages-page');
    const isSidebarExpanded = container?.classList.contains('sidebar-expanded');
    return isSidebarExpanded ? 280 : 72;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.showActionsMenu) {
      this.updateMenuPositionFromButton();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.showActionsMenu) {
      this.updateMenuPositionFromButton();
    }
    this.checkSidebarState();
  }

  private updateMenuPositionFromButton() {
    if (!this.showActionsMenu) return;
    
    const container = document.querySelector(`.actions-menu-container[data-child-service-id="${this.showActionsMenu}"]`) as HTMLElement;
    if (container) {
      const button = container.querySelector('.actions-menu-btn') as HTMLElement;
      if (button) {
        const rect = button.getBoundingClientRect();
        this.updateMenuPosition(rect);
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
  }

  // Helper methods
  getActionLabel(action: SubcriptionContance_ServiceAction): string {
    const labels: { [key in SubcriptionContance_ServiceAction]: string } = {
      [SubcriptionContance_ServiceAction.BoostScoreJob]: 'Tăng điểm Job',
      [SubcriptionContance_ServiceAction.TopList]: 'Top danh sách',
      [SubcriptionContance_ServiceAction.JobBadge]: 'Badge Job',
     [SubcriptionContance_ServiceAction.ThemeCompany]: 'Theme công ty'
    };
    return labels[action] || 'Không xác định';
  }

  getTargetLabel(target: SubcriptionContance_ServiceTarget): string {
    const labels: { [key in SubcriptionContance_ServiceTarget]: string } = {
      [SubcriptionContance_ServiceTarget.JobPost]: 'Tin tuyển dụng',
      [SubcriptionContance_ServiceTarget.Company]: 'Công ty'
    };
    return labels[target] || 'Không xác định';
  }

  getPriorityLabel(priority: JobPriorityLevel): string {
    const labels: { [key in JobPriorityLevel]: string } = {
      [JobPriorityLevel.Low]: 'Thấp',
      [JobPriorityLevel.Medium]: 'Trung bình',
      [JobPriorityLevel.High]: 'Cao',
      [JobPriorityLevel.Urgent]: 'Khẩn cấp'
    };
    return labels[priority] || 'Không xác định';
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