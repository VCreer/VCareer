import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ToastNotificationComponent,
  StatusDropdownComponent,
  StatusOption,
  PaginationComponent,
} from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';
import { JobViewDetail } from 'src/app/proxy/dto/job';
import { RecruitmentCompainService } from 'src/app/proxy/services/job';
import {
  EmploymentType,
  ExperienceLevel,
  PositionType,
} from 'src/app/proxy/constants/job-constant';
import { JobPostService } from 'src/app/proxy/services/job';
import { PostJobDto } from 'src/app/proxy/dto/job-dto';
import { UserSubcriptionService } from 'src/app/proxy/services/subcription';
import { ChildServiceViewDto } from 'src/app/proxy/dto/subcriptions/models';
import { SubcriptionContance_ServiceAction } from 'src/app/proxy/constants/job-constant/subcription-contance-service-action.enum';
import { SubcriptionContance_ServiceTarget } from 'src/app/proxy/constants/job-constant/subcription-contance-service-target.enum';
import { User_ChildService_Service } from 'src/app/proxy/services/subcription';

export interface PackageOption {
  id: string;
  name: string;
  description?: string;
  price?: string;
  childServiceId?: string;
  action?: SubcriptionContance_ServiceAction;
  target?: SubcriptionContance_ServiceTarget;
}

export interface ServicePackage {
  value: string;
  label: string;
  features: string[];
  options?: PackageOption[];
}

export interface ServiceSection {
  action: SubcriptionContance_ServiceAction;
  label: string;
  packages: PackageOption[];
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
  imports: [
    CommonModule,
    FormsModule,
    ToastNotificationComponent,
    StatusDropdownComponent,
    PaginationComponent,
  ],
  templateUrl: './campaign-job-management.html',
  styleUrls: ['./campaign-job-management.scss'],
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
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;
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
    { value: 'closed', label: 'Đã đóng' },
  ];

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Service sections grouped by action
  serviceSections: ServiceSection[] = [];
  isLoadingServices: boolean = false;

  selectedChildServices: { [action: number]: string } = {};
  showStatusDropdownModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService,
    private recruitmentCampaignService: RecruitmentCompainService,
    private jobPostService: JobPostService,
    private userSubcriptionService: UserSubcriptionService,
    private userChildServiceService: User_ChildService_Service
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
      error: err => {
        console.error('Lỗi khi tải danh sách công việc:', err);
        this.showErrorToast('Không thể tải danh sách công việc');
        this.isLoading = false;
      },
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
      viewCount: job.viewCount || 0,
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
      [PositionType.Consultant]: 'Tư vấn',
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
      const matchesSearch =
        !this.searchQuery ||
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

    const isOpening = this.showActionsMenu !== jobId;
    this.showActionsMenu = isOpening ? jobId : null;

    if (isOpening && event) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      this.updateMenuPosition(rect);
    } else {
      this.menuPosition = null;
    }
  }

  private updateMenuPosition(buttonRect: DOMRect) {
    if (!this.showActionsMenu) return;

    const menu = document.querySelector(
      `.actions-menu[data-job-id="${this.showActionsMenu}"]`
    ) as HTMLElement;
    if (!menu) {
      setTimeout(() => this.updateMenuPosition(buttonRect), 10);
      return;
    }

    const menuWidth = menu.offsetWidth || 280;
    const menuHeight = menu.offsetHeight || 100;
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
      maxWidth: menuWidth,
    };
  }

  private getSidebarWidth(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return 0;

    const container = document.querySelector('.campaign-job-management-page');
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
  }

  private updateMenuPositionFromButton() {
    if (!this.showActionsMenu) return;

    const container = document.querySelector(
      `[data-job-id="${this.showActionsMenu}"]`
    ) as HTMLElement;
    if (container) {
      const button = container.querySelector('.actions-btn') as HTMLElement;
      if (button) {
        const rect = button.getBoundingClientRect();
        this.updateMenuPosition(rect);
      }
    }
  }
  selectChildService(action: SubcriptionContance_ServiceAction, childServiceId: string): void {
    if (this.selectedChildServices[action] === childServiceId) {
      delete this.selectedChildServices[action];
    } else {
      this.selectedChildServices[action] = childServiceId;
    }
  }

  isChildServiceSelected(
    action: SubcriptionContance_ServiceAction,
    childServiceId: string
  ): boolean {
    return this.selectedChildServices[action] === childServiceId;
  }

  getSelectedChildServiceIds(): string[] {
    return Object.values(this.selectedChildServices).filter(id => id);
  }
  onEditJob(job: CampaignJob): void {
    this.router.navigate(['/recruiter/job-posting'], {
      queryParams: {
        jobId: job.id,
        campaignId: this.campaignId,
        campaignName: this.campaignName,
      },
    });
    this.showActionsMenu = null;
    this.menuPosition = null;
  }

  onViewCVs(job: CampaignJob): void {
    this.router.navigate(['/recruiter/campaign-job-management-view-cv'], {
      queryParams: {
        jobId: job.id,
        campaignId: this.campaignId,
        campaignName: this.campaignName,
        jobTitle: job.title,
      },
    });
    this.showActionsMenu = null;
    this.menuPosition = null;
  }

  // Đăng bài job
  onPostJob(job: CampaignJob): void {
    // Ngăn double request
    if (this.isPostingJob) return;

    this.isPostingJob = true;
    this.showActionsMenu = null;

    const dto: PostJobDto = {
      jobId: job.id,
      childServiceIds: [], // Tạm thời để rỗng theo yêu cầu
    };

    this.jobPostService.postJob(dto).subscribe({
      next: () => {
        this.showSuccessToast('Đăng bài thành công!');
        // Reload lại danh sách jobs
        this.loadJobs();
      },
      error: err => {
        console.error('Lỗi khi đăng bài:', err);
        this.showErrorToast('Đăng bài thất bại');
      },
      complete: () => {
        this.isPostingJob = false;
      },
    });
  }

  onDeleteJob(job: CampaignJob): void {
    this.jobToDelete = job;
    this.showDeleteModal = true;
    this.showActionsMenu = null;
    this.menuPosition = null;
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
      error: err => {
        console.error('Lỗi khi xóa công việc:', err);
        this.showErrorToast('Xóa công việc thất bại');
      },
      complete: () => {
        this.isDeletingJob = false;
        this.closeDeleteModal();
      },
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
      this.menuPosition = null;
      this.isTogglingPublic = false;
    }, 500);
  }

  onChangeStatusAction(job: CampaignJob): void {
    this.jobToChangeStatus = job;
    this.selectedStatusValue = job.status;
    this.showStatusDropdownModal = true;
    this.showActionsMenu = null;
    this.menuPosition = null;
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

  onAssignPackage(job: CampaignJob): void {
    this.jobToAssignPackage = job;
    this.selectedChildServices = {};
    this.showPackageModal = true;
    this.showActionsMenu = null;
    this.menuPosition = null;

    this.loadChildServicesForJob(job.id);
  }

  loadChildServicesForJob(jobId: string): void {
    this.isLoadingServices = true;
    this.serviceSections = [];
    this.selectedChildServices = {};

    const actions = [
      SubcriptionContance_ServiceAction.BoostScoreJob, // 0
      SubcriptionContance_ServiceAction.TopList, // 1
      SubcriptionContance_ServiceAction.VerifiedBadge, // 2
    ];

    let completedRequests = 0;
    const totalRequests = actions.length;

    actions.forEach(action => {
      this.userSubcriptionService.getJobChildServiceAllowForUser(action).subscribe({
        next: (childServices: ChildServiceViewDto[]) => {
          if (childServices && childServices.length > 0) {
            // LỌC chỉ lấy child services có action trùng với action hiện tại
            const filteredServices = childServices.filter(service => service.action === action);

            if (filteredServices.length > 0) {
              const packages: PackageOption[] = filteredServices.map(service => ({
                id: service.id || '',
                name: service.name || '',
                description: service.description,
                childServiceId: service.id,
                action: service.action,
                target: service.target,
              }));

              this.serviceSections.push({
                action: action,
                label: this.getActionLabel(action),
                packages: packages,
              });
            }
          }

          completedRequests++;
          if (completedRequests === totalRequests) {
            this.isLoadingServices = false;
            this.serviceSections.sort((a, b) => a.action - b.action);
          }
        },
        error: err => {
          console.error(`Error loading services for action ${action}:`, err);
          completedRequests++;
          if (completedRequests === totalRequests) {
            this.isLoadingServices = false;
          }
        },
      });
    });
  }

  getActionLabel(action: SubcriptionContance_ServiceAction): string {
    const labels: { [key in SubcriptionContance_ServiceAction]: string } = {
      [SubcriptionContance_ServiceAction.BoostScoreCv]: 'Tăng điểm CV',
      [SubcriptionContance_ServiceAction.BoostScoreJob]: 'Tăng điểm Job',
      [SubcriptionContance_ServiceAction.TopList]: 'Top danh sách',
      [SubcriptionContance_ServiceAction.VerifiedBadge]: 'Gắn badge xác thực',
      [SubcriptionContance_ServiceAction.IncreaseQuota]: 'Tăng hạn mức đăng tin',
      [SubcriptionContance_ServiceAction.ExtendExpiredDate]: 'Gia hạn ngày hết hạn',
    };
    return labels[action] || 'Dịch vụ';
  }

  confirmAssignPackage(): void {
    if (this.isAssigningPackage || !this.jobToAssignPackage) return;

    const selectedIds = this.getSelectedChildServiceIds();

    if (selectedIds.length === 0) {
      this.showErrorToast('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }

    this.isAssigningPackage = true;
    const jobId = this.jobToAssignPackage.id;

    // Gọi API activeService với list childServiceIds
    this.userChildServiceService.activeService(selectedIds,jobId).subscribe({
      next: () => {
        this.showSuccessToast(`Đã kích hoạt ${selectedIds.length} dịch vụ thành công`);
        this.isAssigningPackage = false;
        this.closePackageModal();
        this.loadJobs(); // Reload để cập nhật UI
      },
      error: err => {
        console.error('Lỗi khi kích hoạt dịch vụ:', err);
        this.showErrorToast('Kích hoạt dịch vụ thất bại');
        this.isAssigningPackage = false;
      },
    });
  }

  closePackageModal(): void {
    this.showPackageModal = false;
    this.jobToAssignPackage = null;
    this.selectedChildServices = {};
    this.serviceSections = [];
    this.isLoadingServices = false;
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
    // Find package by ID in service sections
    for (const section of this.serviceSections) {
      const packageOption = section.packages.find(p => p.id === packageType);
      if (packageOption) {
        return packageOption.name || 'Chưa gắn gói';
      }
    }
    return 'Chưa gắn gói';
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
      this.menuPosition = null;
    }
  }
}
