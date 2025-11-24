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
  StatusOption
} from '../../../../shared/components';

export interface ChildService {
  id: string;
  title: string;
  description: string;
  type: 'typeA' | 'typeB' | 'typeC';
  originalPrice: number;
  isActive: boolean;
}

export interface ChildServicePackage {
  id: string;
  childServiceId: string;
  childService?: ChildService;
  subscriptionServiceId: string;
}

export interface PackageSale {
  id: string;
  packageId: string;
  package?: ServicePackage;
  salePercent: number; // %
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'upcoming' | 'expired';
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface SelectedServiceAction {
  actionKey: string;
  options?: string[];
}

interface ServiceActionOption {
  value: string;
  label: string;
}

interface ServiceActionItem {
  actionKey: string;
  label: string;
  description: string;
  options: ServiceActionOption[];
  expanded: boolean;
  selectedOptions: string[];
}

interface ServiceActionOptionConfig {
  value: string;
  label: string;
}

interface ServiceActionItem {
  actionKey: string;
  label: string;
  description: string;
  options: ServiceActionOptionConfig[];
  expanded: boolean;
  selectedOptions: string[];
}

export interface ServicePackage {
  id: string;
  title: string;
  description: string;
  target: 'candidate' | 'recruiter';
  status: 'active' | 'inactive' | 'draft';
  originalPrice: number; // giá gốc
  isLimited: boolean; // giới hạn số lượng mua trong 1 khoảng thời gian của toàn bộ người dùng
  isBuyLimited: boolean; // giới hạn số lượng mua của mỗi cá nhân
  totalBuyEachUser?: number; // số lượng tối đa mua của mỗi cá nhân
  isLifeTime: boolean;
  dayDuration?: number; // số ngày (nếu không phải lifetime)
  isActive: boolean;
  childService_SubcriptionServices: ChildServicePackage[]; // list các dịch vụ con
  serviceActions?: SelectedServiceAction[];
  createdDate: string;
  updatedDate?: string;
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
  // Sidebar state
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Packages data
  allPackages: ServicePackage[] = [];
  filteredPackages: ServicePackage[] = [];
  paginatedPackages: ServicePackage[] = [];

  // Search & Filter
  searchKeyword = '';
  filterStatus = '';
  filterType = '';
  sortField: 'title' | 'originalPrice' | 'dayDuration' | 'target' | 'status' | 'createdDate' = 'createdDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Status options
  statusOptions: StatusOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' }
  ];

  // Type options (Target)
  typeOptions = [
    { value: '', label: 'Tất cả đối tượng' },
    { value: 'candidate', label: 'Ứng viên' },
    { value: 'recruiter', label: 'Nhà tuyển dụng' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Actions Menu
  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuPackageId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  // Modals
  showCreatePackageModal = false;
  showEditPackageModal = false;
  showCreateSaleModal = false;
  showEditSaleModal = false;
  selectedPackage: ServicePackage | null = null;
  selectedSale: PackageSale | null = null;

  // Tabs
  activeTab: 'packages' | 'sales' = 'packages';

  // Sales data
  allSales: PackageSale[] = [];
  filteredSales: PackageSale[] = [];
  paginatedSales: PackageSale[] = [];

  // Sale search & filter
  saleSearchKeyword = '';
  saleFilterStatus = '';
  saleCurrentPage = 1;
  saleItemsPerPage = 10;
  saleTotalPages = 1;
  salePackageOptions: { value: string; label: string }[] = [];

  // Package Form
  packageForm: Partial<ServicePackage> = {
    title: '',
    description: '',
    target: 'recruiter',
    status: 'draft',
    originalPrice: 0,
    isLimited: false,
    isBuyLimited: false,
    totalBuyEachUser: undefined,
    isLifeTime: false,
    dayDuration: undefined,
    isActive: false,
    childService_SubcriptionServices: []
  };

  private readonly serviceActionDefinitions: ServiceActionItem[] = [
    {
      actionKey: 'BoostScoreCv',
      label: 'BoostScoreCv',
      description: 'Tăng điểm hiển thị CV',
      options: [
        { value: 'boost5', label: 'Tăng 5 điểm' },
        { value: 'boost10', label: 'Tăng 10 điểm' },
        { value: 'boost20', label: 'Tăng 20 điểm' }
      ],
      expanded: false,
      selectedOptions: []
    },
    {
      actionKey: 'BoostScoreJob',
      label: 'BoostScoreJob',
      description: 'Tăng điểm hiển thị Job',
      options: [
        { value: 'boost5', label: 'Tăng 5 điểm' },
        { value: 'boost10', label: 'Tăng 10 điểm' },
        { value: 'boost20', label: 'Tăng 20 điểm' }
      ],
      expanded: false,
      selectedOptions: []
    },
    {
      actionKey: 'TopList',
      label: 'TopList',
      description: 'Cho lên Top danh sách',
      options: [
        { value: 'top5', label: 'Top 5' },
        { value: 'top10', label: 'Top 10' },
        { value: 'top20', label: 'Top 20' }
      ],
      expanded: false,
      selectedOptions: []
    },
    {
      actionKey: 'VerifiedBadge',
      label: 'VerifiedBadge',
      description: 'Gắn badge xác thực',
      options: [
        { value: 'urgent', label: 'Gắn nhãn khẩn cấp' },
        { value: 'new', label: 'Gắn nhãn mới' },
        { value: 'hot', label: 'Gắn nhãn nổi bật' }
      ],
      expanded: false,
      selectedOptions: []
    },
    {
      actionKey: 'IncreaseQuota',
      label: 'IncreaseQuota',
      description: 'Tăng số lượng job được đăng',
      options: [
        { value: 'plus5', label: 'Tăng thêm 5 job' },
        { value: 'plus10', label: 'Tăng thêm 10 job' },
        { value: 'plus20', label: 'Tăng thêm 20 job' }
      ],
      expanded: false,
      selectedOptions: []
    },
    {
      actionKey: 'ExtendExpiredDate',
      label: 'ExtendExpiredDate',
      description: 'Gia hạn thời gian hết hạn',
      options: [
        { value: 'extend7', label: 'Gia hạn 7 ngày' },
        { value: 'extend14', label: 'Gia hạn 14 ngày' },
        { value: 'extend30', label: 'Gia hạn 30 ngày' }
      ],
      expanded: false,
      selectedOptions: []
    }
  ];
  serviceActions: ServiceActionItem[] = [];

  isSavingPackage = false;
  isSavingPackageEdit = false;
  isSavingSale = false;
  validationErrors: Record<string, string> = {};
  saleValidationErrors: Record<string, string> = {};

  // Sale Form
  saleForm: Partial<PackageSale> = {
    packageId: '',
    salePercent: 0,
    startDate: '',
    endDate: '',
    status: 'upcoming',
    isActive: false
  };

  // Sale Status options
  saleStatusOptions: StatusOption[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang áp dụng' },
    { value: 'inactive', label: 'Ngừng áp dụng' },
    { value: 'upcoming', label: 'Sắp tới' },
    { value: 'expired', label: 'Hết hạn' }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

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

    // Bắt đầu với bảng trống
    this.allPackages = [];
    this.filteredPackages = [];
    this.paginatedPackages = [];
    this.applyFilters();
    this.applySaleFilters();
    this.initializeServiceActions();
  }

  applySaleFilters(): void {
    let result = [...this.allSales];

    // Search
    if (this.saleSearchKeyword.trim()) {
      const keyword = this.saleSearchKeyword.toLowerCase();
      result = result.filter(sale =>
        sale.package?.title.toLowerCase().includes(keyword) ||
        sale.id.toLowerCase().includes(keyword)
      );
    }

    // Filter by status
    if (this.saleFilterStatus) {
      result = result.filter(s => s.status === this.saleFilterStatus);
    }

    this.filteredSales = result;
    this.saleTotalPages = Math.ceil(this.filteredSales.length / this.saleItemsPerPage);
    this.updateSalePagination();
  }

  updateSalePagination(): void {
    const start = (this.saleCurrentPage - 1) * this.saleItemsPerPage;
    const end = start + this.saleItemsPerPage;
    this.paginatedSales = this.filteredSales.slice(start, end);
  }

  onSaleSearchChange(): void {
    this.saleCurrentPage = 1;
    this.applySaleFilters();
  }

  onSaleFilterChange(): void {
    this.saleCurrentPage = 1;
    this.applySaleFilters();
  }

  onSalePageChange(page: number): void {
    this.saleCurrentPage = page;
    this.updateSalePagination();
  }

  private refreshSalePackageOptions(): void {
    this.salePackageOptions = this.allPackages.map(pkg => ({
      value: pkg.id,
      label: pkg.title || 'Gói chưa có tên'
    }));
  }

  getSaleStatusLabel(sale: PackageSale): string {
    const labels: { [key: string]: string } = {
      'active': 'Đang áp dụng',
      'inactive': 'Ngừng áp dụng',
      'upcoming': 'Sắp tới',
      'expired': 'Hết hạn'
    };
    return labels[sale.status] || sale.status;
  }

  getSaleStatusClass(sale: PackageSale): string {
    return `sale-status-${sale.status}`;
  }

  onCreateSale(): void {
    this.resetSaleForm();
    this.resetSaleValidationErrors();
    this.showCreateSaleModal = true;
  }

  onEditSale(sale: PackageSale): void {
    this.resetSaleValidationErrors();
    this.selectedSale = sale;
    this.saleForm = {
      id: sale.id,
      packageId: sale.packageId,
      salePercent: sale.salePercent,
      startDate: sale.startDate,
      endDate: sale.endDate,
      status: sale.status,
      isActive: sale.isActive
    };
    this.showEditSaleModal = true;
  }

  resetSaleForm(): void {
    this.saleForm = {
      packageId: '',
      salePercent: 0,
      startDate: '',
      endDate: '',
      status: 'upcoming',
      isActive: false
    };
    this.selectedSale = null;
  }

  onConfirmCreateSale(): void {
    if (this.isSavingSale) {
      return;
    }
    if (!this.validateSaleForm()) {
      return;
    }
    this.isSavingSale = true;
    // TODO: Call API to create sale
    const newSale: PackageSale = {
      id: `sale_${Date.now()}`,
      packageId: this.saleForm.packageId!,
      package: this.allPackages.find(p => p.id === this.saleForm.packageId),
      salePercent: this.saleForm.salePercent!,
      startDate: this.saleForm.startDate!,
      endDate: this.saleForm.endDate!,
      status: this.saleForm.status!,
      isActive: this.saleForm.isActive || false,
      createdDate: new Date().toISOString()
    };

    this.allSales = [newSale, ...this.allSales];
    this.showToastMessage('Tạo sale thành công', 'success');
    this.showCreateSaleModal = false;
    this.applySaleFilters();
    setTimeout(() => (this.isSavingSale = false), 250);
  }

  onConfirmEditSale(): void {
    if (!this.selectedSale) return;
    if (!this.validateSaleForm()) {
      return;
    }

    // TODO: Call API to update sale
    const index = this.allSales.findIndex(s => s.id === this.selectedSale!.id);
    if (index !== -1) {
      this.allSales[index] = {
        ...this.allSales[index],
        packageId: this.saleForm.packageId!,
        package: this.allPackages.find(p => p.id === this.saleForm.packageId),
        salePercent: this.saleForm.salePercent!,
        startDate: this.saleForm.startDate!,
        endDate: this.saleForm.endDate!,
        status: this.saleForm.status!,
        isActive: this.saleForm.isActive || false,
        updatedDate: new Date().toISOString()
      };
    }

    this.showToastMessage('Cập nhật sale thành công', 'success');
    this.showEditSaleModal = false;
    this.applySaleFilters();
  }

  onDeleteSale(sale: PackageSale): void {
    if (confirm(`Bạn có chắc chắn muốn xóa sale này?`)) {
      // TODO: Call API to delete sale
      this.allSales = this.allSales.filter(s => s.id !== sale.id);
      this.showToastMessage('Đã xóa sale', 'success');
      this.applySaleFilters();
    }
  }

  onToggleSaleActive(sale: PackageSale): void {
    // TODO: Call API to toggle active status
    sale.isActive = !sale.isActive;
    if (sale.isActive) {
      sale.status = 'active';
    } else {
      sale.status = 'inactive';
    }
    this.showToastMessage(
      sale.isActive ? 'Đã kích hoạt sale' : 'Đã vô hiệu hóa sale',
      'success'
    );
    this.applySaleFilters();
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
    
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

  toggleActionsMenu(itemId: string, event: Event): void {
    event.stopPropagation();
    
    if (this.showActionsMenu === itemId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = itemId;
      this.currentMenuPackageId = itemId;
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;
      
      // Retry logic to ensure menu is in DOM
      let retries = 0;
      const tryPosition = () => {
        const menu = document.querySelector(`.actions-menu[data-package-id="${itemId}"]`) as HTMLElement;
        if (menu || retries >= 5) {
          if (menu) {
            this.updateMenuPosition(itemId);
            this.setupScrollListener(itemId);
          }
        } else {
          retries++;
          setTimeout(tryPosition, 10);
        }
      };
      setTimeout(tryPosition, 0);
    }
  }

  closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuPackageId = null;
    this.currentMenuButton = null;
    this.removeScrollListener();
  }

  private setupScrollListener(packageId: string): void {
    this.removeScrollListener();
    
    this.scrollListener = () => {
      if (this.showActionsMenu === packageId && this.currentMenuPackageId === packageId) {
        this.updateMenuPosition(packageId);
      }
    };
    
    window.addEventListener('scroll', this.scrollListener, true);
    window.addEventListener('resize', this.scrollListener);
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      window.removeEventListener('resize', this.scrollListener);
      this.scrollListener = undefined;
    }
  }

  private getSidebarWidth(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return 0;
    
    const pageElement = document.querySelector('.manage-service-packages-page');
    if (pageElement && pageElement.classList.contains('sidebar-expanded')) {
      return 280;
    }
    return 72;
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
    const sidebarWidth = this.getSidebarWidth();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;
    
    // Position menu below button, aligned to right
    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;
    
    // Ensure menu doesn't go off left edge (consider sidebar)
    const minLeft = sidebarWidth + padding;
    if (left < minLeft) {
      left = Math.max(minLeft, rect.left);
    }
    
    // Ensure menu doesn't go off right edge
    const maxLeft = viewportWidth - menuWidth - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    
    // Ensure menu doesn't go off bottom
    if (top + menuHeight > viewportHeight - padding) {
      top = rect.top - menuHeight - 4;
    }
    
    // Ensure menu doesn't go off top
    if (top < padding) {
      top = padding;
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  loadPackages(): void {
    this.allPackages = [];
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allPackages];

    // Search
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      result = result.filter(pkg =>
        pkg.title.toLowerCase().includes(keyword) ||
        pkg.description.toLowerCase().includes(keyword) ||
        pkg.target.toLowerCase().includes(keyword) ||
        pkg.status.toLowerCase().includes(keyword)
      );
    }

    // Filter by status
    if (this.filterStatus) {
      if (this.filterStatus === 'active') {
        result = result.filter(p => p.isActive && p.status === 'active');
      } else if (this.filterStatus === 'inactive') {
        result = result.filter(p => !p.isActive || p.status === 'inactive');
      }
    }

    // Filter by type (target)
    if (this.filterType) {
      result = result.filter(p => p.target === this.filterType);
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (this.sortField === 'createdDate') {
        aValue = new Date(a.createdDate || 0).getTime();
        bValue = new Date(b.createdDate || 0).getTime();
      } else if (this.sortField === 'originalPrice' || this.sortField === 'dayDuration') {
        aValue = Number(a[this.sortField] || 0);
        bValue = Number(b[this.sortField] || 0);
      } else {
        aValue = String(a[this.sortField] || '').toLowerCase();
        bValue = String(b[this.sortField] || '').toLowerCase();
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredPackages = result;
    this.totalPages = Math.ceil(this.filteredPackages.length / this.itemsPerPage);
    this.updatePagination();
    this.refreshSalePackageOptions();
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

  onSort(field: 'title' | 'originalPrice' | 'dayDuration' | 'target' | 'status' | 'createdDate'): void {
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

  // Actions
  onCreatePackage(): void {
    this.resetPackageForm();
    this.initializeServiceActions();
    this.resetValidationErrors();
    this.showCreatePackageModal = true;
  }

  onEditPackage(pkg: ServicePackage): void {
    this.selectedPackage = pkg;
    this.packageForm = {
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      target: pkg.target,
      status: pkg.status,
      originalPrice: pkg.originalPrice,
      isLimited: pkg.isLimited,
      isBuyLimited: pkg.isBuyLimited,
      totalBuyEachUser: pkg.totalBuyEachUser,
      isLifeTime: pkg.isLifeTime,
      dayDuration: pkg.dayDuration,
      isActive: pkg.isActive,
      childService_SubcriptionServices: pkg.childService_SubcriptionServices
    };
    this.initializeServiceActions(pkg.serviceActions);
    this.resetValidationErrors();
    this.showEditPackageModal = true;
  }

  resetPackageForm(): void {
    this.packageForm = {
      title: '',
      description: '',
      target: 'recruiter',
      status: 'draft',
      originalPrice: 0,
      isLimited: false,
      isBuyLimited: false,
      totalBuyEachUser: undefined,
      isLifeTime: false,
      dayDuration: undefined,
      isActive: false,
      childService_SubcriptionServices: []
    };
    this.selectedPackage = null;
    this.initializeServiceActions();
    this.resetValidationErrors();
  }

  onConfirmCreatePackage(): void {
    if (this.isSavingPackage) {
      return;
    }

    this.isSavingPackage = true;
    try {
      if (!this.validatePackageForm()) {
        return;
      }

      const normalizedStatus = this.packageForm.status || 'draft';
      const normalizedIsActive = normalizedStatus === 'active';

      const newPackage: ServicePackage = {
        id: this.generatePackageId(),
        title: this.packageForm.title!,
        description: this.packageForm.description!,
        target: this.packageForm.target!,
        status: normalizedStatus,
        originalPrice: this.packageForm.originalPrice!,
        isLimited: this.packageForm.isLimited || false,
        isBuyLimited: this.packageForm.isBuyLimited || false,
        totalBuyEachUser: this.packageForm.totalBuyEachUser,
        isLifeTime: this.packageForm.isLifeTime || false,
        dayDuration: this.packageForm.dayDuration,
        isActive: normalizedIsActive,
        childService_SubcriptionServices: [],
        serviceActions: this.getSelectedServiceActions(),
        createdDate: new Date().toISOString()
      };

      this.allPackages = [newPackage, ...this.allPackages];
      this.refreshSalePackageOptions();
      this.showToastMessage('Tạo gói dịch vụ thành công', 'success');
      this.showCreatePackageModal = false;
      this.applyFilters();
    } finally {
      this.resetSavingFlag('create');
    }
  }

  onConfirmEditPackage(): void {
    if (this.isSavingPackageEdit || !this.selectedPackage) {
      return;
    }

    this.isSavingPackageEdit = true;
    try {
      if (!this.validatePackageForm()) {
        return;
      }

      const index = this.allPackages.findIndex(p => p.id === this.selectedPackage!.id);
      if (index !== -1) {
        const normalizedStatus = this.packageForm.status || 'draft';
        const normalizedIsActive = normalizedStatus === 'active';

        const updatedPackage: ServicePackage = {
          ...this.allPackages[index],
          title: this.packageForm.title!,
          description: this.packageForm.description!,
          target: this.packageForm.target!,
          status: normalizedStatus,
          originalPrice: this.packageForm.originalPrice!,
          isLimited: this.packageForm.isLimited || false,
          isBuyLimited: this.packageForm.isBuyLimited || false,
          totalBuyEachUser: this.packageForm.totalBuyEachUser,
          isLifeTime: this.packageForm.isLifeTime || false,
          dayDuration: this.packageForm.dayDuration,
          isActive: normalizedIsActive,
          childService_SubcriptionServices: this.selectedPackage?.childService_SubcriptionServices || [],
          serviceActions: this.getSelectedServiceActions(),
          updatedDate: new Date().toISOString()
        };

        this.allPackages = [
          ...this.allPackages.slice(0, index),
          updatedPackage,
          ...this.allPackages.slice(index + 1)
        ];
        this.refreshSalePackageOptions();
      }

      this.showToastMessage('Cập nhật gói dịch vụ thành công', 'success');
      this.showEditPackageModal = false;
      this.applyFilters();
    } finally {
      this.resetSavingFlag('edit');
    }
  }

  toggleServiceAction(actionKey: string): void {
    this.serviceActions = this.serviceActions.map(action =>
      action.actionKey === actionKey
        ? { ...action, expanded: !action.expanded }
        : { ...action, expanded: false }
    );
    this.cdr.detectChanges();
  }

  isServiceActionSelected(actionKey: string): boolean {
    return !!this.serviceActions.find(action => action.actionKey === actionKey && action.selectedOptions.length > 0);
  }

  isServiceActionExpanded(actionKey: string): boolean {
    return !!this.serviceActions.find(action => action.actionKey === actionKey && action.expanded);
  }

  toggleServiceActionOption(actionKey: string, optionValue: string): void {
    this.serviceActions = this.serviceActions.map(action => {
      if (action.actionKey !== actionKey) {
        return action;
      }
      const selected = action.selectedOptions.includes(optionValue)
        ? action.selectedOptions.filter(opt => opt !== optionValue)
        : [...action.selectedOptions, optionValue];

      return {
        ...action,
        selectedOptions: selected,
        expanded: selected.length === 0 ? true : action.expanded
      };
    });

    this.cdr.detectChanges();
  }

  isServiceActionOptionSelected(actionKey: string, optionValue: string): boolean {
    return !!this.serviceActions.find(action => action.actionKey === actionKey && action.selectedOptions.includes(optionValue));
  }

  private resetSavingFlag(type: 'create' | 'edit'): void {
    setTimeout(() => {
      if (type === 'create') {
        this.isSavingPackage = false;
      } else {
        this.isSavingPackageEdit = false;
      }
    }, 250);
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

    const hasServiceAction = this.serviceActions.some(action => action.selectedOptions.length > 0);
    if (!hasServiceAction) {
      errors['serviceActions'] = 'Vui lòng chọn ít nhất một tính năng dịch vụ';
      isValid = false;
    }

    this.validationErrors = errors;
    return isValid;
  }

  private resetValidationErrors(): void {
    this.validationErrors = {};
  }

  private validateSaleForm(): boolean {
    this.resetSaleValidationErrors();
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!this.saleForm.packageId) {
      errors['salePackageId'] = 'Vui lòng chọn gói dịch vụ';
      isValid = false;
    }

    if (!this.saleForm.salePercent || this.saleForm.salePercent <= 0 || this.saleForm.salePercent > 100) {
      errors['salePercent'] = 'Phần trăm sale phải từ 1 đến 100';
      isValid = false;
    }

    if (!this.saleForm.startDate) {
      errors['saleStartDate'] = 'Vui lòng chọn ngày bắt đầu';
      isValid = false;
    }

    if (!this.saleForm.endDate) {
      errors['saleEndDate'] = 'Vui lòng chọn ngày kết thúc';
      isValid = false;
    }

    if (this.saleForm.startDate && this.saleForm.endDate) {
      const startDate = new Date(this.saleForm.startDate);
      const endDate = new Date(this.saleForm.endDate);
      if (endDate <= startDate) {
        errors['saleEndDate'] = 'Ngày kết thúc phải sau ngày bắt đầu';
        isValid = false;
      }
    }

    this.saleValidationErrors = errors;
    return isValid;
  }

  private resetSaleValidationErrors(): void {
    this.saleValidationErrors = {};
  }

  private getSelectedServiceActions(): SelectedServiceAction[] {
    return this.serviceActions
      .filter(action => action.selectedOptions.length > 0)
      .map(action => ({
        actionKey: action.actionKey,
        options: [...action.selectedOptions]
      }));
  }

  private initializeServiceActions(existing?: SelectedServiceAction[]): void {
    const existingMap = new Map<string, string[]>();

    existing?.forEach(action => {
      existingMap.set(action.actionKey, action.options ? [...action.options] : []);
    });

    this.serviceActions = this.serviceActionDefinitions.map(config => {
      const selected = existingMap.get(config.actionKey) || [];
      return {
        ...config,
        options: [...config.options],
        selectedOptions: selected,
        expanded: selected.length > 0
      };
    });
  }

  private generatePackageId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  onToggleActive(pkg: ServicePackage): void {
    // TODO: Call API to toggle active status
    pkg.isActive = !pkg.isActive;
    if (pkg.isActive) {
      pkg.status = 'active';
    } else {
      pkg.status = 'inactive';
    }
    this.showToastMessage(
      pkg.isActive ? 'Đã kích hoạt gói dịch vụ' : 'Đã vô hiệu hóa gói dịch vụ',
      'success'
    );
    this.applyFilters();
  }

  onDeletePackage(pkg: ServicePackage): void {
    // TODO: Show confirmation modal and call API to delete
    if (confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${pkg.title}"?`)) {
      // TODO: Call API to delete package
      this.allPackages = this.allPackages.filter(p => p.id !== pkg.id);
      this.showToastMessage('Đã xóa gói dịch vụ', 'success');
      this.applyFilters();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
  }

  switchTab(tab: 'packages' | 'sales'): void {
    this.activeTab = tab;
    this.closeActionsMenu();
  }

  // Helper methods
  getStatusLabel(pkg: ServicePackage): string {
    if (!pkg.isActive) return 'Ngừng hoạt động';
    if (pkg.status === 'active') return 'Đang hoạt động';
    if (pkg.status === 'inactive') return 'Ngừng hoạt động';
    return 'Bản nháp';
  }

  getStatusClass(pkg: ServicePackage): string {
    if (!pkg.isActive || pkg.status === 'inactive') return 'status-inactive';
    if (pkg.status === 'draft') return 'status-draft';
    return 'status-active';
  }

  getTargetLabel(target: string): string {
    const labels: { [key: string]: string } = {
      'candidate': 'Ứng viên',
      'recruiter': 'Nhà tuyển dụng'
    };
    return labels[target] || target;
  }

  getTargetClass(target: string): string {
    return `target-${target}`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getDurationLabel(pkg: ServicePackage): string {
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
    const padding = 32; // 16px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }
}

