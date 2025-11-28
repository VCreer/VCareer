import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent, StatusDropdownComponent, StatusOption, PaginationComponent } from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';
import { JobViewDetail } from 'src/app/proxy/dto/job';
import { RecruitmentCompainService } from 'src/app/proxy/services/job';
import { EmploymentType, ExperienceLevel, PositionType } from 'src/app/proxy/constants/job-constant';
import { JobPostService } from 'src/app/proxy/services/job';
import { PostJobDto } from 'src/app/proxy/dto/job-dto';

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
  options?: PackageOption[];
}

export interface CampaignJob {
  id: string;
  title: string;
  position: string;
  location: string;
  status: 'active' | 'inactive' | 'draft' | 'closed';
  isPublic: boolean;
  packageTypes: string[];
  packageOptions?: { [packageType: string]: string[] };
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
  
  // Loading state
  isLoading: boolean = false;
  
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
  
  // Khóa để ngăn double request
  private isPostingJob = false;
  private isDeletingJob = false;
  private isTogglingPublic = false;
  private isChangingStatus = false;
  private isAssigningPackage = false;
  
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
  
  selectedPackages: string[] = [];
  selectedPackageOptions: { [packageType: string]: string[] } = {};
  activePackage: string | null = null;
  showStatusDropdownModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService,
    private recruitmentCampaignService: RecruitmentCompainService,
    private jobPostService: JobPostService
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
      
      // Load jobs when we have campaignId
      if (this.campaignId) {
        this.loadJobs();
      }
    });
  }

  ngOnDestroy(): void {
    this.sidebarSync.cleanup(this.componentId);
    this.removeScrollListener();
  }

  loadJobs(): void {
    if (!this.campaignId) {
      this.showErrorToast('Không tìm thấy ID chiến dịch');
      return;
    }

    this.isLoading = true;
    
    this.recruitmentCampaignService.getJobsByCompainIdByCompainId(this.campaignId).subscribe({
      next: (jobDetails: JobViewDetail[]) => {
        // Map JobViewDetail to CampaignJob format
        this.jobs = jobDetails.map(job => this.mapJobViewDetailToCampaignJob(job));
        this.filteredJobs = [...this.jobs];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách công việc:', err);
        this.showErrorToast('Không thể tải danh sách công việc');
        this.isLoading = false;
      }
    });
  }

  // Map JobViewDetail từ API sang CampaignJob format cho UI
  private mapJobViewDetailToCampaignJob(job: JobViewDetail): CampaignJob {
    return {
      id: job.id || '',
      title: job.title || '',
      position: this.getPositionLabel(job.positionType),
      location: this.getLocationText(job.provinceCode, job.wardCode),
      status: this.determineJobStatus(job),
      isPublic: true, // Default value, có thể cập nhật nếu API có trường này
      packageTypes: [], // Default empty, có thể cập nhật nếu API có trường này
      packageOptions: {},
      createdAt: job.postedAt || new Date().toISOString(),
      updatedAt: job.postedAt || new Date().toISOString(),
      appliedCount: job.applyCount || 0,
      viewCount: job.viewCount || 0
    };
  }

  // Xác định trạng thái job dựa trên expiresAt
  private determineJobStatus(job: JobViewDetail): 'active' | 'inactive' | 'draft' | 'closed' {
    if (!job.expiresAt) return 'draft';
    
    const expiresDate = new Date(job.expiresAt);
    const now = new Date();
    
    if (expiresDate < now) return 'closed';
    return 'active';
  }

  // Lấy label của position type
  private getPositionLabel(positionType?: PositionType): string {
    if (!positionType) return 'N/A';
    
    const positionLabels: { [key in PositionType]: string } = {
      [PositionType.Employee]: 'Nhân viên',
      [PositionType.TeamLead]: 'Trưởng nhóm',
      [PositionType.Manager]: 'Quản lý',
      [PositionType.Supervisor]: 'Giám sát',
      [PositionType.BranchManager]: 'Trưởng chi nhánh',
      [PositionType.DeputyDirector]: 'Phó giám đốc',
      [PositionType.Director]: 'Giám đốc',
      [PositionType.Intern]: 'Thực tập sinh',
      [PositionType.Specialist]: 'Chuyên viên',
      [PositionType.SeniorSpecialist]: 'Chuyên viên cao cấp',
      [PositionType.Expert]: 'Chuyên gia',
      [PositionType.Consultant]: 'Tư vấn'
    };
    
    return positionLabels[positionType] || 'N/A';
  }

  // Lấy text location (có thể cải thiện bằng cách gọi GeoService)
  private getLocationText(provinceCode?: number, wardCode?: number): string {
    // TODO: Có thể gọi GeoService để lấy tên thực tế
    return provinceCode ? `Mã tỉnh: ${provinceCode}` : 'N/A';
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    this.filterJobs();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
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
    this.router.navigate(['/recruiter/job-posting'], {
      queryParams: { 
        jobId: job.id, 
        campaignId: this.campaignId,
        campaignName: this.campaignName 
      }
    });
    this.closeActionsMenu();
  }

  onViewCVs(job: CampaignJob): void {
    this.router.navigate(['/recruiter/campaign-job-management-view-cv'], {
      queryParams: { 
        jobId: job.id, 
        campaignId: this.campaignId,
        campaignName: this.campaignName,
        jobTitle: job.title
      }
    });
    this.showActionsMenu = null;
  }

  // Đăng bài job
  onPostJob(job: CampaignJob): void {
    // Ngăn double request
    if (this.isPostingJob) return;

    this.isPostingJob = true;
    this.showActionsMenu = null;

    const dto: PostJobDto = {
      jobId: job.id,
      childServiceIds: [] // Tạm thời để rỗng theo yêu cầu
    };

    this.jobPostService.postJob(dto).subscribe({
      next: () => {
        this.showSuccessToast('Đăng bài thành công!');
        // Reload lại danh sách jobs
        this.loadJobs();
      },
      error: (err) => {
        console.error('Lỗi khi đăng bài:', err);
        this.showErrorToast('Đăng bài thất bại');
      },
      complete: () => {
        this.isPostingJob = false;
      }
    });
  }

  onDeleteJob(job: CampaignJob): void {
    this.jobToDelete = job;
    this.showDeleteModal = true;
    this.showActionsMenu = null;
  }

  confirmDelete(): void {
    // Ngăn double request
    if (this.isDeletingJob || !this.jobToDelete) return;

    this.isDeletingJob = true;

    this.jobPostService.deleteJobPostById(this.jobToDelete.id).subscribe({
      next: () => {
        const index = this.jobs.findIndex(j => j.id === this.jobToDelete!.id);
        if (index > -1) {
          this.jobs.splice(index, 1);
          this.filterJobs();
        }
        this.showSuccessToast('Đã xóa công việc thành công');
      },
      error: (err) => {
        console.error('Lỗi khi xóa công việc:', err);
        this.showErrorToast('Xóa công việc thất bại');
      },
      complete: () => {
        this.isDeletingJob = false;
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.jobToDelete = null;
  }

  onTogglePublicAction(job: CampaignJob): void {
    // Ngăn double request
    if (this.isTogglingPublic) return;

    this.isTogglingPublic = true;
    const newPublicState = !job.isPublic;

    // TODO: Call API to update job public/private status
    setTimeout(() => {
      job.isPublic = newPublicState;
      this.showSuccessToast(`Đã ${job.isPublic ? 'công khai' : 'ẩn'} công việc`);
      this.showActionsMenu = null;
      this.isTogglingPublic = false;
    }, 500);
  }

  onChangeStatusAction(job: CampaignJob): void {
    this.jobToChangeStatus = job;
    this.selectedStatusValue = job.status;
    this.showStatusDropdownModal = true;
    this.showActionsMenu = null;
  }

  closeStatusModal(): void {
    this.showStatusDropdownModal = false;
    this.jobToChangeStatus = null;
    this.selectedStatusValue = '';
  }

  confirmChangeStatus(): void {
    // Ngăn double request
    if (this.isChangingStatus || !this.jobToChangeStatus || !this.selectedStatusValue) return;

    this.isChangingStatus = true;

    // TODO: Call API to update job status
    setTimeout(() => {
      this.jobToChangeStatus!.status = this.selectedStatusValue as CampaignJob['status'];
      this.showSuccessToast('Đã cập nhật trạng thái công việc');
      this.isChangingStatus = false;
      this.closeStatusModal();
    }, 500);
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
      this.selectedPackages.splice(index, 1);
      delete this.selectedPackageOptions[packageValue];
      if (this.activePackage === packageValue) {
        this.activePackage = null;
      }
    } else {
      this.selectedPackages.push(packageValue);
      this.selectedPackageOptions[packageValue] = [];
      this.activePackage = packageValue;
    }
  }

  onPackageContentClick(packageValue: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const isSelected = this.isPackageSelected(packageValue);
    
    if (isSelected) {
      if (!this.selectedPackageOptions[packageValue]) {
        this.selectedPackageOptions[packageValue] = [];
      }
      this.activePackage = packageValue;
    }
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
    this.selectedPackages = job.packageTypes ? [...job.packageTypes] : [];
    this.selectedPackageOptions = {};
    this.selectedPackages.forEach(pkgValue => {
      this.selectedPackageOptions[pkgValue] = [];
    });
    this.activePackage = this.selectedPackages.length > 0 ? this.selectedPackages[0] : null;
    this.showPackageModal = true;
    this.showActionsMenu = null;
  }

  confirmAssignPackage(): void {
    // Ngăn double request
    if (this.isAssigningPackage || !this.jobToAssignPackage) return;

    this.isAssigningPackage = true;

    // TODO: Call API to assign package
    setTimeout(() => {
      this.jobToAssignPackage!.packageTypes = [...this.selectedPackages];
      this.jobToAssignPackage!.packageOptions = { ...this.selectedPackageOptions };
      
      const packagesCount = this.selectedPackages.length;
      const totalOptions = Object.values(this.selectedPackageOptions).reduce((sum, opts) => sum + opts.length, 0);
      const message = packagesCount > 0 
        ? `Đã gắn ${packagesCount} gói${totalOptions > 0 ? ` với ${totalOptions} tùy chọn` : ''} thành công`
        : 'Đã cập nhật gói tuyển dụng thành công';
      
      this.showSuccessToast(message);
      this.isAssigningPackage = false;
      this.closePackageModal();
    }, 500);
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

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
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
      this.showActionsMenu = null;
    }
  }
}