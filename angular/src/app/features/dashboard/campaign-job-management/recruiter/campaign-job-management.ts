import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent, StatusDropdownComponent, StatusOption, PaginationComponent } from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';

export interface PackageOption {
  id: string;
  name: string;
  description?: string;
  price?: string;
}

export interface ServicePackage {
  value: string;
  label: string;
  features: string[];
  options?: PackageOption[]; // Các options/tùy chọn trong gói
}

export interface CampaignJob {
  id: string;
  title: string;
  position: string;
  location: string;
  status: 'active' | 'inactive' | 'draft' | 'closed';
  isPublic: boolean;
  packageTypes: string[]; // Có thể chọn nhiều gói
  packageOptions?: { [packageType: string]: string[] }; // Các options đã chọn trong từng gói
  createdAt: string;
  updatedAt: string;
  appliedCount: number;
  viewCount: number;
}

@Component({
  selector: 'app-campaign-job-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent, StatusDropdownComponent, PaginationComponent],
  templateUrl: './campaign-job-management.html',
  styleUrls: ['./campaign-job-management.scss']
})
export class CampaignJobManagementComponent implements OnInit, OnDestroy {
  private readonly componentId = 'campaign-job-management';
  
  campaignId: string | null = null;
  campaignName: string = '';
  
  // Job list
  jobs: CampaignJob[] = [];
  filteredJobs: CampaignJob[] = [];
  paginatedJobs: CampaignJob[] = [];
  searchQuery: string = '';
  selectedStatus: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // UI state
  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuJobId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;
  showDeleteModal = false;
  jobToDelete: CampaignJob | null = null;
  showPackageModal = false;
  jobToAssignPackage: CampaignJob | null = null;
  jobToChangeStatus: CampaignJob | null = null;
  selectedStatusValue: string = '';
  
  // Status options
  statusOptions: StatusOption[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang tuyển' },
    { value: 'inactive', label: 'Tạm dừng' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'closed', label: 'Đã đóng' }
  ];
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  // Package options with details and sub-options
  packageOptions: ServicePackage[] = [
    { 
      value: '', 
      label: 'Chưa gắn gói',
      features: []
    },
    { 
      value: 'label', 
      label: 'Gắn nhãn',
      features: [
        'Tùy chỉnh nhãn cho tin tuyển dụng',
        'Tăng độ nổi bật',
        'Thu hút ứng viên'
      ],
      options: [
        { id: 'hot', name: 'Nhãn Hot', description: 'Tin tuyển dụng nổi bật', price: '50,000 VNĐ' },
        { id: 'urgent', name: 'Nhãn Urgent', description: 'Tuyển dụng gấp', price: '40,000 VNĐ' },
        { id: 'new', name: 'Nhãn New', description: 'Tin mới đăng', price: '30,000 VNĐ' },
        { id: 'featured', name: 'Nhãn Featured', description: 'Tin nổi bật', price: '60,000 VNĐ' }
      ]
    },
    { 
      value: 'boost', 
      label: 'Gói Boost',
      features: [
        'Tăng lượt xem',
        'Hiển thị ưu tiên',
        'Tăng tỷ lệ ứng tuyển'
      ],
      options: [
        { id: 'boost-7days', name: 'Boost 7 ngày', description: 'Tăng hiển thị trong 7 ngày', price: '200,000 VNĐ' },
        { id: 'boost-14days', name: 'Boost 14 ngày', description: 'Tăng hiển thị trong 14 ngày', price: '350,000 VNĐ' },
        { id: 'boost-30days', name: 'Boost 30 ngày', description: 'Tăng hiển thị trong 30 ngày', price: '600,000 VNĐ' }
      ]
    }
  ];
  
  selectedPackages: string[] = []; // Có thể chọn nhiều gói
  selectedPackageOptions: { [packageType: string]: string[] } = {}; // Các options đã chọn trong từng gói
  activePackage: string | null = null; // Package đang được chọn để hiển thị options
  showStatusDropdownModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService
  ) {}

  ngOnInit(): void {
    // Setup sidebar sync
    this.sidebarSync.setupSync(
      '.campaign-job-management-page',
      '.breadcrumb-box',
      this.componentId
    );

    // Get campaign ID and name from query params
    this.route.queryParams.subscribe(params => {
      this.campaignId = params['campaignId'] || null;
      this.campaignName = params['campaignName'] || 'Chiến dịch tuyển dụng';
    });

    // Load mock data
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.sidebarSync.cleanup(this.componentId);
    this.removeScrollListener();
  }

  loadJobs(): void {
    // Mock data - replace with actual API call
    this.jobs = [
      {
        id: 'JOB-001',
        title: 'FullStack Developer (NodeJS, ReactJS, Vue JS)',
        position: 'Fullstack Developer',
        location: 'Hà Nội',
        status: 'active',
        isPublic: true,
        packageTypes: ['label', 'boost'],
        packageOptions: {
          'label': ['hot', 'urgent'],
          'boost': ['boost-7days']
        },
        createdAt: '2025-01-15',
        updatedAt: '2025-01-20',
        appliedCount: 45,
        viewCount: 0
      },
      {
        id: 'JOB-002',
        title: 'Senior Frontend Developer',
        position: 'Frontend Developer',
        location: 'TP.HCM',
        status: 'active',
        isPublic: false,
        packageTypes: ['label'],
        packageOptions: {
          'label': ['hot', 'urgent', 'featured']
        },
        createdAt: '2025-01-18',
        updatedAt: '2025-01-22',
        appliedCount: 78,
        viewCount: 0
      },
      {
        id: 'JOB-003',
        title: 'Backend Developer (Python, Django)',
        position: 'Backend Developer',
        location: 'Hà Nội',
        status: 'inactive',
        isPublic: true,
        packageTypes: [],
        packageOptions: {},
        createdAt: '2025-01-10',
        updatedAt: '2025-01-15',
        appliedCount: 32,
        viewCount: 0
      },
      {
        id: 'JOB-004',
        title: 'UI/UX Designer',
        position: 'Designer',
        location: 'Đà Nẵng',
        status: 'draft',
        isPublic: false,
        packageTypes: ['boost'],
        packageOptions: {
          'boost': ['boost-7days']
        },
        createdAt: '2025-01-25',
        updatedAt: '2025-01-25',
        appliedCount: 0,
        viewCount: 0
      }
    ];
    
    this.filteredJobs = [...this.jobs];
    this.updatePagination();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1; // Reset to first page when searching
    this.filterJobs();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page when filtering
    this.filterJobs();
  }

  filterJobs(): void {
    this.filteredJobs = this.jobs.filter(job => {
      const matchesSearch = !this.searchQuery || 
        job.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.position.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = this.selectedStatus === 'all' || job.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredJobs.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedJobs = this.filteredJobs.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  toggleActionsMenu(jobId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.showActionsMenu === jobId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = jobId;
      this.currentMenuJobId = jobId;
      if (event) {
        const button = (event.target as HTMLElement).closest('.actions-btn') as HTMLElement;
        this.currentMenuButton = button || null;
      }
      setTimeout(() => {
        this.positionActionsMenu(jobId, event);
        this.setupScrollListener(jobId);
      }, 0);
    }
  }

  private closeActionsMenu(): void {
    this.closeActionsMenu();
    this.currentMenuJobId = null;
    this.currentMenuButton = null;
    this.removeScrollListener();
  }

  private setupScrollListener(jobId: string): void {
    this.removeScrollListener();
    
    this.scrollListener = () => {
      if (this.showActionsMenu === jobId && this.currentMenuJobId === jobId) {
        this.updateMenuPosition(jobId);
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
    
    const pageElement = document.querySelector('.campaign-job-management-page');
    if (pageElement && pageElement.classList.contains('sidebar-expanded')) {
      return 280;
    }
    return 72;
  }

  private updateMenuPosition(jobId: string): void {
    const container = document.querySelector(`.actions-menu-container[data-job-id="${jobId}"]`);
    if (!container) {
      setTimeout(() => this.updateMenuPosition(jobId), 10);
      return;
    }
    const menu = container.querySelector('.actions-menu') as HTMLElement;
    const button = this.currentMenuButton;
    
    if (!menu || !button) {
      // Retry after a short delay if menu not found
      if (!menu) {
        setTimeout(() => this.updateMenuPosition(jobId), 10);
      }
      return;
    }
    
    const rect = button.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 180;
    const sidebarWidth = this.getSidebarWidth();
    const viewportWidth = window.innerWidth;
    const padding = 8;
    
    // Position menu below button, aligned to right
    let left = rect.right - menuWidth;
    
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
    
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${left}px`;
  }

  private positionActionsMenu(jobId: string, event?: Event): void {
    // Use stored button reference if available, otherwise try to find from event
    if (!this.currentMenuButton && event) {
      const button = (event.target as HTMLElement).closest('.actions-btn') as HTMLElement;
      this.currentMenuButton = button || null;
    }
    
    if (!this.currentMenuButton) return;
    
    this.updateMenuPosition(jobId);
  }

  onEditJob(job: CampaignJob): void {
    // Navigate to edit job page
    this.router.navigate(['/recruiter/job-posting'], {
      queryParams: { jobId: job.id, campaignId: this.campaignId }
    });
    this.closeActionsMenu();
  }

  onViewCVs(job: CampaignJob): void {
    // Navigate to view CVs page
    this.router.navigate(['/recruiter/campaign-job-management-view-cv'], {
      queryParams: { 
        jobId: job.id, 
        campaignId: this.campaignId,
        campaignName: this.campaignName,
        jobTitle: job.title
      }
    });
    this.closeActionsMenu();
  }

  onDeleteJob(job: CampaignJob): void {
    this.jobToDelete = job;
    this.showDeleteModal = true;
    this.closeActionsMenu();
  }

  confirmDelete(): void {
    if (this.jobToDelete) {
      const index = this.jobs.findIndex(j => j.id === this.jobToDelete!.id);
      if (index > -1) {
        this.jobs.splice(index, 1);
        this.filterJobs();
        this.showSuccessToast('Đã xóa công việc thành công');
      }
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.jobToDelete = null;
  }

  onTogglePublicAction(job: CampaignJob): void {
    job.isPublic = !job.isPublic;
    // TODO: Call API to update job
    this.showSuccessToast(`Đã ${job.isPublic ? 'công khai' : 'ẩn'} công việc`);
    this.closeActionsMenu();
  }

  onChangeStatusAction(job: CampaignJob): void {
    this.jobToChangeStatus = job;
    this.selectedStatusValue = job.status;
    this.showStatusDropdownModal = true;
    this.closeActionsMenu();
  }

  closeStatusModal(): void {
    this.showStatusDropdownModal = false;
    this.jobToChangeStatus = null;
    this.selectedStatusValue = '';
  }

  confirmChangeStatus(): void {
    if (this.jobToChangeStatus && this.selectedStatusValue) {
      this.jobToChangeStatus.status = this.selectedStatusValue as CampaignJob['status'];
      // TODO: Call API to update job status
      this.showSuccessToast('Đã cập nhật trạng thái công việc');
    }
    this.closeStatusModal();
  }

  onSelectStatus(status: string): void {
    this.selectedStatusValue = status;
    this.confirmChangeStatus();
  }

  togglePackage(packageValue: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const index = this.selectedPackages.indexOf(packageValue);
    if (index > -1) {
      // Bỏ chọn gói
      this.selectedPackages.splice(index, 1);
      // Xóa options của gói đó
      delete this.selectedPackageOptions[packageValue];
      // Nếu đang active package này thì reset activePackage
      if (this.activePackage === packageValue) {
        this.activePackage = null;
      }
    } else {
      // Chọn gói mới
      this.selectedPackages.push(packageValue);
      // Khởi tạo options cho gói mới là mảng rỗng (user phải chọn lại)
      this.selectedPackageOptions[packageValue] = [];
      // Set active package để hiển thị options khi chọn gói mới
      this.activePackage = packageValue;
    }
  }

  // Method để xử lý click vào package content (chỉ để xem options)
  onPackageContentClick(packageValue: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const isSelected = this.isPackageSelected(packageValue);
    
    // Chỉ xem options nếu package đã được chọn
    if (isSelected) {
      // Đảm bảo selectedPackageOptions cho package này được khởi tạo là mảng rỗng nếu chưa có
      if (!this.selectedPackageOptions[packageValue]) {
        this.selectedPackageOptions[packageValue] = [];
      }
      this.activePackage = packageValue;
    }
    // Nếu chưa selected, không làm gì cả (chỉ có thể xem options khi đã chọn package)
  }

  isPackageSelected(packageValue: string): boolean {
    return this.selectedPackages.includes(packageValue);
  }

  getPackageOptions(packageValue: string): PackageOption[] {
    const selected = this.packageOptions.find(pkg => pkg.value === packageValue);
    return selected && selected.options ? selected.options : [];
  }

  togglePackageOption(packageValue: string, optionId: string): void {
    if (!this.selectedPackageOptions[packageValue]) {
      this.selectedPackageOptions[packageValue] = [];
    }
    const index = this.selectedPackageOptions[packageValue].indexOf(optionId);
    if (index > -1) {
      this.selectedPackageOptions[packageValue].splice(index, 1);
    } else {
      this.selectedPackageOptions[packageValue].push(optionId);
    }
  }

  isPackageOptionSelected(packageValue: string, optionId: string): boolean {
    return this.selectedPackageOptions[packageValue]?.includes(optionId) || false;
  }

  onAssignPackage(job: CampaignJob): void {
    this.jobToAssignPackage = job;
    // Chỉ khôi phục packages đã chọn, KHÔNG khôi phục options (user phải chọn lại)
    this.selectedPackages = job.packageTypes ? [...job.packageTypes] : [];
    // Reset options và khởi tạo mảng rỗng cho mỗi package đã chọn
    this.selectedPackageOptions = {};
    this.selectedPackages.forEach(pkgValue => {
      this.selectedPackageOptions[pkgValue] = [];
    });
    // Set active package là package đầu tiên nếu có
    this.activePackage = this.selectedPackages.length > 0 ? this.selectedPackages[0] : null;
    this.showPackageModal = true;
    this.closeActionsMenu();
  }

  confirmAssignPackage(): void {
    if (this.jobToAssignPackage) {
      this.jobToAssignPackage.packageTypes = [...this.selectedPackages];
      this.jobToAssignPackage.packageOptions = { ...this.selectedPackageOptions };
      // TODO: Call API to assign package
      const packagesCount = this.selectedPackages.length;
      const totalOptions = Object.values(this.selectedPackageOptions).reduce((sum, opts) => sum + opts.length, 0);
      const message = packagesCount > 0 
        ? `Đã gắn ${packagesCount} gói${totalOptions > 0 ? ` với ${totalOptions} tùy chọn` : ''} thành công`
        : 'Đã cập nhật gói tuyển dụng thành công';
      this.showSuccessToast(message);
    }
    this.closePackageModal();
  }

  closePackageModal(): void {
    this.showPackageModal = false;
    this.jobToAssignPackage = null;
    this.selectedPackages = [];
    this.selectedPackageOptions = {};
    this.activePackage = null;
  }

  getStatusLabel(status: CampaignJob['status']): string {
    switch (status) {
      case 'active':
        return 'Đang tuyển';
      case 'inactive':
        return 'Tạm dừng';
      case 'draft':
        return 'Bản nháp';
      case 'closed':
        return 'Đã đóng';
      default:
        return status;
    }
  }

  getStatusClass(status: CampaignJob['status']): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'draft':
        return 'status-draft';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  }

  getPackageLabel(packageType: string): string {
    const packageOption = this.packageOptions.find(p => p.value === packageType);
    return packageOption ? packageOption.label : 'Chưa gắn gói';
  }

  getPackageClass(packageType: string): string {
    switch (packageType) {
      case 'label':
        return 'package-label';
      case 'boost':
        return 'package-boost';
      default:
        return 'package-default';
    }
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onBack(): void {
    this.router.navigate(['/recruiter/recruitment-campaign']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container')) {
      this.closeActionsMenu();
    }
  }
}