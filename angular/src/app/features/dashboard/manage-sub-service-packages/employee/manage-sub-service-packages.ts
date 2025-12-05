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
  SelectOption,
  ToggleSwitchComponent
} from '../../../../shared/components';
import { ChildService_Service } from '../../../../proxy/services/subcription/child-service-.service';
import { ChildServiceCreateDto, ChildServiceViewDto } from '../../../../proxy/dto/subcriptions/models';
import { SubcriptionContance_ServiceAction, subcriptionContance_ServiceActionOptions } from '../../../../proxy/constants/job-constant/subcription-contance-service-action.enum';
import { SubcriptionContance_ServiceTarget, subcriptionContance_ServiceTargetOptions } from '../../../../proxy/constants/job-constant/subcription-contance-service-target.enum';
import { JobPriorityLevel, jobPriorityLevelOptions } from '../../../../proxy/constants/job-constant/job-priority-level.enum';
import { PagingDto } from '../../../../proxy/iservices/common/models';

export interface ChildService {
  id: string;
  name: string;
  description: string;
  action?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
  priority?: JobPriorityLevel;
  isActive: boolean;
  isLifeTime: boolean;
  isAutoActive: boolean;
  isLimitUsedTime: boolean;
  timeUsedLimit?: number;
  dayDuration?: number;
  value?: number;
}

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
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Data
  allChildServices: ChildService[] = [];
  filteredChildServices: ChildService[] = [];
  paginatedChildServices: ChildService[] = [];

  // Search & Filter
  searchKeyword = '';
  filterAction: string = '';
  filterTarget: string = '';
  filterStatus = '';
  sortField: 'name' | 'action' | 'target' | 'isActive' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Status options
  statusOptions: StatusOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  // Action options
  actionOptions: SelectOption[] = [
    { value: '', label: 'Tất cả hành động' },
    ...subcriptionContance_ServiceActionOptions.map(opt => ({
      value: String(opt.value),
      label: this.getActionLabel(opt.value as SubcriptionContance_ServiceAction)
    }))
  ];

  // Target options
  targetOptions: SelectOption[] = [
    { value: '', label: 'Tất cả đối tượng' },
    ...subcriptionContance_ServiceTargetOptions.map(opt => ({
      value: String(opt.value),
      label: this.getTargetLabel(opt.value as SubcriptionContance_ServiceTarget)
    }))
  ];

  // Form options for create/edit - will be initialized in ngOnInit
  formActionOptions: SelectOption[] = [];
  formTargetOptions: SelectOption[] = [];
  formPriorityOptions: SelectOption[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Modals
  showCreateModal = false;
  showEditModal = false;
  selectedChildService: ChildService | null = null;

  // Actions Menu
  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;

  // Form data
  createForm: ChildServiceCreateDto = {
    name: '',
    description: '',
    action: undefined,
    target: undefined,
    isActive: true,
    isLifeTime: false,
    isAutoActive: false,
    isLimitUsedTime: false,
    timeUsedLimit: undefined,
    dayDuration: undefined,
    value: undefined
  };

  // String bindings for select fields (SelectFieldComponent uses string)
  createFormActionString: string = '';
  createFormTargetString: string = '';
  createFormPriorityString: string = '';

  editForm: Partial<ChildService> = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private childServiceService: ChildService_Service
  ) {}

  ngOnInit(): void {
    // Initialize form options
    this.formActionOptions = [
      { value: '', label: 'Chọn hành động' },
      ...subcriptionContance_ServiceActionOptions.map(opt => ({
        value: String(opt.value),
        label: this.getActionLabel(opt.value as SubcriptionContance_ServiceAction)
      }))
    ];

    this.formTargetOptions = [
      { value: '', label: 'Chọn đối tượng' },
      ...subcriptionContance_ServiceTargetOptions.map(opt => ({
        value: String(opt.value),
        label: this.getTargetLabel(opt.value as SubcriptionContance_ServiceTarget)
      }))
    ];

    this.formPriorityOptions = [
      { value: '', label: 'Chọn mức độ ưu tiên' },
      ...jobPriorityLevelOptions.map(opt => ({
        value: String(opt.value),
        label: this.getPriorityLabel(opt.value as JobPriorityLevel)
      }))
    ];

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
    const paging: PagingDto = {
      pageSize: 1000, // Load all for now
      pageIndex: 0
    };

    const serviceActionParam = this.getServiceActionParam();
    const targetParam = this.getServiceTargetParam();

    this.childServiceService.getChildServices(
      serviceActionParam,
      targetParam,
      paging
    ).subscribe({
      next: (childServices: ChildServiceViewDto[]) => {
        this.allChildServices = childServices.map(cs => this.mapToChildService(cs));
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading child services:', err);
        this.showToastMessage('Không thể tải danh sách dịch vụ phụ', 'error');
        // Load mock data for development
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    this.allChildServices = [
      {
        id: '1',
        name: 'Boost CV Score',
        description: 'Tăng điểm CV để hiển thị ưu tiên',
        action: SubcriptionContance_ServiceAction.BoostScoreCv,
        target: SubcriptionContance_ServiceTarget.Cv,
        isActive: true,
        isLifeTime: false,
        isAutoActive: true,
        isLimitUsedTime: true,
        timeUsedLimit: 10,
        dayDuration: 30,
        value: 100
      },
      {
        id: '2',
        name: 'Top List Job',
        description: 'Đưa tin tuyển dụng lên top danh sách',
        action: SubcriptionContance_ServiceAction.TopList,
        target: SubcriptionContance_ServiceTarget.JobPost,
        isActive: true,
        isLifeTime: true,
        isAutoActive: false,
        isLimitUsedTime: false
      }
    ];
    this.applyFilters();
  }

  private mapToChildService(dto: ChildServiceViewDto): ChildService {
    return {
      id: dto.cHildServiceId || '',
      name: dto.name || '',
      description: dto.description || '',
      action: dto.action,
      target: dto.target,
      priority: (dto as any).priority as JobPriorityLevel | undefined,
      isActive: dto.isActive,
      isLifeTime: dto.isLifeTime,
      isAutoActive: dto.isAutoActive,
      isLimitUsedTime: dto.isLimitUsedTime,
      timeUsedLimit: dto.timeUsedLimit,
      dayDuration: dto.dayDuration,
      value: dto.value
    };
  }

  private getServiceActionParam(): string | undefined {
    if (!this.filterAction && this.filterAction !== '0') {
      return undefined;
    }

    const actionIndex = Number(this.filterAction);
    if (Number.isNaN(actionIndex)) {
      return undefined;
    }

    return SubcriptionContance_ServiceAction[actionIndex];
  }

  private getServiceTargetParam(): string | undefined {
    if (!this.filterTarget && this.filterTarget !== '0') {
      return undefined;
    }

    const targetIndex = Number(this.filterTarget);
    if (Number.isNaN(targetIndex)) {
      return undefined;
    }

    return SubcriptionContance_ServiceTarget[targetIndex];
  }

  applyFilters(): void {
    let result = [...this.allChildServices];

    // Search
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(cs =>
        cs.name.toLowerCase().includes(keyword) ||
        cs.description.toLowerCase().includes(keyword)
      );
    }

    // Filter by action
    if (this.filterAction) {
      result = result.filter(cs => cs.action === Number(this.filterAction));
    }

    // Filter by target
    if (this.filterTarget) {
      result = result.filter(cs => cs.target === Number(this.filterTarget));
    }

    // Filter by status
    if (this.filterStatus) {
      if (this.filterStatus === 'active') {
        result = result.filter(cs => cs.isActive);
      } else if (this.filterStatus === 'inactive') {
        result = result.filter(cs => !cs.isActive);
      }
    }

    // Sort
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
    this.createForm = {
      name: '',
      description: '',
      action: undefined,
      target: undefined,
      isActive: true,
      isLifeTime: false,
      isAutoActive: false,
      isLimitUsedTime: false,
      timeUsedLimit: undefined,
      dayDuration: undefined,
      value: undefined
    };
    this.createFormActionString = '';
    this.createFormTargetString = '';
    this.createFormPriorityString = '';
    this.showCreateModal = true;
  }

  onConfirmCreate(): void {
    if (!this.createForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên dịch vụ', 'error');
      return;
    }

    const dto: ChildServiceCreateDto & { priority?: JobPriorityLevel } = {
      name: this.createForm.name,
      description: this.createForm.description,
      action: this.createFormActionString ? (Number(this.createFormActionString) as SubcriptionContance_ServiceAction) : undefined,
      target: this.createFormTargetString ? (Number(this.createFormTargetString) as SubcriptionContance_ServiceTarget) : undefined,
      isActive: this.createForm.isActive,
      isLifeTime: this.createForm.isLifeTime,
      isAutoActive: this.createForm.isAutoActive,
      isLimitUsedTime: this.createForm.isLimitUsedTime,
      timeUsedLimit: this.createForm.isLimitUsedTime ? this.createForm.timeUsedLimit : undefined,
      dayDuration: !this.createForm.isLifeTime ? this.createForm.dayDuration : undefined,
      value: this.createForm.value,
      priority: this.createFormPriorityString ? (Number(this.createFormPriorityString) as JobPriorityLevel) : undefined
    };

    this.childServiceService.createChildService(dto).subscribe({
      next: () => {
        this.showToastMessage('Tạo dịch vụ phụ thành công', 'success');
        this.showCreateModal = false;
        this.loadChildServices();
      },
      error: (err) => {
        console.error('Error creating child service:', err);
        this.showToastMessage('Tạo dịch vụ phụ thất bại', 'error');
      }
    });
  }

  onEditChildService(childService: ChildService): void {
    this.selectedChildService = childService;
    this.editForm = {
      id: childService.id,
      name: childService.name,
      description: childService.description,
      isActive: childService.isActive
    };
    this.showEditModal = true;
    this.showActionsMenu = null;
    this.menuPosition = null;
  }

  onConfirmEdit(): void {
    if (!this.selectedChildService || !this.editForm.name?.trim()) {
      this.showToastMessage('Vui lòng nhập tên dịch vụ', 'error');
      return;
    }

    // TODO: Call update API when available
    const index = this.allChildServices.findIndex(cs => cs.id === this.selectedChildService!.id);
    if (index > -1) {
      this.allChildServices[index].name = this.editForm.name || '';
      this.allChildServices[index].description = this.editForm.description || '';
      this.allChildServices[index].isActive = this.editForm.isActive ?? true;
      this.applyFilters();
      this.showToastMessage('Cập nhật dịch vụ phụ thành công', 'success');
    }
    this.showEditModal = false;
    this.selectedChildService = null;
  }

  onDeleteChildService(childService: ChildService): void {
    if (confirm(`Xóa dịch vụ phụ "${childService.name}"?`)) {
      this.childServiceService.deleteChildService(childService.id).subscribe({
        next: () => {
          this.showToastMessage('Đã xóa dịch vụ phụ', 'success');
          this.loadChildServices();
        },
        error: (err) => {
          console.error('Error deleting child service:', err);
          this.showToastMessage('Xóa dịch vụ phụ thất bại', 'error');
        }
      });
    }
    this.showActionsMenu = null;
    this.menuPosition = null;
  }

  onToggleActive(childService: ChildService): void {
    // TODO: Call API to toggle active status
    childService.isActive = !childService.isActive;
    this.applyFilters();
    this.showToastMessage(
      childService.isActive ? 'Đã kích hoạt dịch vụ phụ' : 'Đã vô hiệu hóa dịch vụ phụ',
      'success'
    );
    this.showActionsMenu = null;
    this.menuPosition = null;
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
    
    // Tính sidebar width
    const sidebarWidth = this.getSidebarWidth();
    const padding = isMobile ? 16 : 24;
    const paddingLeft = sidebarWidth + padding;
    
    // Tính left position: đặt menu bên phải button
    const menuGap = 8;
    let menuLeft = buttonRect.right + menuGap;
    
    // Nếu không đủ chỗ bên phải, đặt menu bên trái button
    const spaceOnRight = viewportWidth - buttonRect.right;
    if (spaceOnRight < menuWidth) {
      menuLeft = buttonRect.left - menuWidth - menuGap;
      
      // Nếu menu bị che bởi sidebar, đặt menu ở paddingLeft
      if (menuLeft < paddingLeft) {
        menuLeft = paddingLeft;
      }
    }
    
    // Đảm bảo menu không vượt quá viewport bên phải
    if (menuLeft + menuWidth > viewportWidth - padding) {
      menuLeft = Math.max(paddingLeft, viewportWidth - menuWidth - padding);
    }
    
    // Đảm bảo menu không bị che bởi sidebar
    if (menuLeft < paddingLeft) {
      menuLeft = paddingLeft;
    }
    
    // Tính top position: đo chính xác breadcrumb-box height
    const breadcrumbBox = document.querySelector('.breadcrumb-box') as HTMLElement;
    const breadcrumbBottom = breadcrumbBox ? breadcrumbBox.getBoundingClientRect().bottom : 120;
    
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top - breadcrumbBottom;
    
    let top = buttonRect.bottom + menuGap;
    
    // Đảm bảo menu không đè lên breadcrumb-box
    if (top < breadcrumbBottom + menuGap) {
      top = breadcrumbBottom + menuGap;
    }
    
    // Nếu không đủ chỗ bên dưới và có đủ chỗ phía trên, hiển thị menu phía trên button
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      top = buttonRect.top - menuHeight - menuGap;
      
      // Đảm bảo menu không đè lên breadcrumb-box khi hiển thị phía trên
      if (top < breadcrumbBottom + menuGap) {
        top = breadcrumbBottom + menuGap;
      }
    }
    
    // Đảm bảo menu không vượt quá viewport
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

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.showActionsMenu) {
      this.updateMenuPositionFromButton();
    }
  }

  @HostListener('window:resize', ['$event'])
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
      this.showActionsMenu = null;
      this.menuPosition = null;
    }
  }

  // Helper methods
  getActionLabel(action: SubcriptionContance_ServiceAction): string {
    const labels: { [key in SubcriptionContance_ServiceAction]: string } = {
      [SubcriptionContance_ServiceAction.BoostScoreCv]: 'Tăng điểm CV',
      [SubcriptionContance_ServiceAction.BoostScoreJob]: 'Tăng điểm Job',
      [SubcriptionContance_ServiceAction.TopList]: 'Top danh sách',
      [SubcriptionContance_ServiceAction.VerifiedBadge]: 'Badge xác thực',
      [SubcriptionContance_ServiceAction.IncreaseQuota]: 'Tăng hạn mức',
      [SubcriptionContance_ServiceAction.ExtendExpiredDate]: 'Gia hạn ngày hết hạn'
    };
    return labels[action] || 'Không xác định';
  }

  getTargetLabel(target: SubcriptionContance_ServiceTarget): string {
    const labels: { [key in SubcriptionContance_ServiceTarget]: string } = {
      [SubcriptionContance_ServiceTarget.JobPost]: 'Tin tuyển dụng',
      [SubcriptionContance_ServiceTarget.Company]: 'Công ty',
      [SubcriptionContance_ServiceTarget.Cv]: 'CV'
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

