import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginationComponent, ToastNotificationComponent } from '../../../../shared/components';
import { JobApproveViewDto, JobFilterDto, JobRequestViewDto, JobViewManageDetailDto } from 'src/app/proxy/dto/job-dto';
import { JobPostService } from 'src/app/proxy/services/job';
import { JobStatus, JobPriorityLevel, RiskJobLevel, EmploymentType, PositionType, ExperienceLevel } from 'src/app/proxy/constants/job-constant';

interface JobSummaryCard {
  label: string;
  value: number;
  icon: string;
  borderColor: string;
  status?: JobStatus;
}

type ViewMode = 'pending' | 'approved' | 'rejected';

@Component({
  selector: 'app-employee-job-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, ToastNotificationComponent],
  templateUrl: './manage-recruitment-information.html',
  styleUrls: ['./manage-recruitment-information.scss'],
})
export class EmployeeJobManagementComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  currentViewMode: ViewMode = 'pending';

  summaryCards: JobSummaryCard[] = [
    { label: 'Tổng số tin', value: 0, icon: 'fa fa-file-alt', borderColor: '#0F83BA' },
    { label: 'Chờ duyệt', value: 0, icon: 'fa fa-clock', borderColor: '#f59e0b', status: JobStatus.Pending },
    { label: 'Đã duyệt', value: 0, icon: 'fa fa-check-circle', borderColor: '#10b981', status: JobStatus.Open },
    { label: 'Đã từ chối', value: 0, icon: 'fa fa-times-circle', borderColor: '#ef4444', status: JobStatus.Rejected },
  ];

  // Filter options for pending view
  priorityLevelOptions = [
    { label: 'Tất cả mức độ ưu tiên', value: null },
    { label: 'Thấp', value: JobPriorityLevel.Low},
    { label: 'Trung bình', value: JobPriorityLevel.Medium },
    { label: 'Cao', value: JobPriorityLevel.High },
    { label: 'Khẩn cấp', value: JobPriorityLevel.Urgent },
  ];

  riskJobLevelOptions = [
    { label: 'Tất cả mức độ rủi ro', value: null },
    { label: 'Thấp', value: RiskJobLevel.Low },
    { label: 'Trung bình', value: RiskJobLevel.Normal},
    { label: 'Cao', value: RiskJobLevel.Hight},
  ];

  selectedPriorityLevel = this.priorityLevelOptions[0];
  selectedRiskJobLevel = this.riskJobLevelOptions[0];

  showPriorityDropdown = false;
  showRiskJobDropdown = false;

  // Filters for approved/rejected view
  searchField = '';
  startTime = '';
  endTime = '';

  // Separate lists for different view modes
  pendingJobs: JobApproveViewDto[] = [];
  managedJobs: JobViewManageDetailDto[] = [];
  
  filteredPostings: (JobApproveViewDto | JobViewManageDetailDto)[] = [];
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  selectedJob: JobApproveViewDto | JobViewManageDetailDto | null = null;
  showRejectModal = false;
  rejectReason = '';
  hoveredJobId: string | null = null;
  showViewRejectReasonModal = false;
  editingRejectReason = false;
  viewingRejectReasonJob: JobApproveViewDto | JobViewManageDetailDto | null = null;
  isLoading = false;

  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private jobPostService: JobPostService
  ) {}

  ngOnInit(): void {
    this.initSidebarObserver();
    this.loadSummaryCounts();
    this.loadJobPostings();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  //#region API Calls

  private loadSummaryCounts(): void {
    // Load count for Pending
    this.jobPostService.countJobByStatusByStatus(JobStatus.Pending).subscribe({
      next: (count) => {
        this.summaryCards[1].value = count;
        this.updateTotalCount();
      },
      error: (error) => console.error('Error loading pending count:', error)
    });

    // Load count for Open (Approved)
    this.jobPostService.countJobByStatusByStatus(JobStatus.Open).subscribe({
      next: (count) => {
        this.summaryCards[2].value = count;
        this.updateTotalCount();
      },
      error: (error) => console.error('Error loading approved count:', error)
    });

    // Load count for Rejected
    this.jobPostService.countJobByStatusByStatus(JobStatus.Rejected).subscribe({
      next: (count) => {
        this.summaryCards[3].value = count;
        this.updateTotalCount();
      },
      error: (error) => console.error('Error loading rejected count:', error)
    });
  }

  private updateTotalCount(): void {
    const total = this.summaryCards[1].value + this.summaryCards[2].value + this.summaryCards[3].value;
    this.summaryCards[0].value = total;
  }

  private loadJobPostings(): void {
    this.isLoading = true;

    if (this.currentViewMode === 'pending') {
      this.loadPendingJobs();
    } else {
      this.loadManagedJobs();
    }
  }

  private loadPendingJobs(): void {
    const filterDto: JobFilterDto = {
      priorityLevel: this.selectedPriorityLevel.value ?? undefined,
      riskJobLevel: this.selectedRiskJobLevel.value ?? undefined,
      page: this.currentPage,
      pageSize: this.itemsPerPage,
    };

    this.jobPostService.showJobPostNeedApproveByDto(filterDto).subscribe({
      next: (data: JobApproveViewDto[]) => {
        this.pendingJobs = data;
        this.filteredPostings = data;
        
        // Get total count for pending jobs
        this.jobPostService.countJobByStatusByStatus(JobStatus.Pending).subscribe({
          next: (totalCount) => {
            this.totalItems = totalCount;
            this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
            if (this.currentPage > this.totalPages && this.totalPages > 0) {
              this.currentPage = this.totalPages;
              this.loadPendingJobs();
            }
            this.isLoading = false;
          },
          error: () => {
            // Fallback
            this.totalItems = data.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading pending jobs:', error);
        this.showErrorToast('Không thể tải danh sách tin tuyển dụng chờ duyệt');
        this.isLoading = false;
      },
    });
  }

  private loadManagedJobs(): void {
    const status = this.currentViewMode === 'approved' ? JobStatus.Open : JobStatus.Rejected;
    
    const requestDto: JobRequestViewDto = {
      searchField: this.searchField || undefined,
      status: status,
      startTime: this.startTime || undefined,
      endTime: this.endTime || undefined,
      page: this.currentPage,
      pageSize: this.itemsPerPage,
    };

    this.jobPostService.getJobPostManageByDto(requestDto).subscribe({
      next: (data: JobViewManageDetailDto[]) => {
        // Store all data for client-side pagination
        this.managedJobs = data;
        this.filteredPostings = data;
        
        // Calculate pagination based on total data
        this.totalItems = data.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
        
        // If current page exceeds total pages, reset to page 1
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = 1;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading managed jobs:', error);
        this.showErrorToast('Không thể tải danh sách tin tuyển dụng');
        this.isLoading = false;
      },
    });
  }

  get pagedPostings(): (JobApproveViewDto | JobViewManageDetailDto)[] {
    // Client-side pagination: slice the filtered data
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPostings.slice(startIndex, endIndex);
  }

  //#endregion

  //#region Sidebar & UI

  private initSidebarObserver(): void {
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
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
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

  getModalPaddingLeft(): string {
    if (window.innerWidth <= 768) return '0';
    return `${this.sidebarWidth}px`;
  }

  getModalMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) return 'calc(100% - 40px)';
    const overlayPadding = 40;
    const availableWidth = viewportWidth - this.sidebarWidth - overlayPadding;
    return `${Math.min(500, availableWidth)}px`;
  }

  getPageMarginLeft(): string {
    if (window.innerWidth <= 768) return '0';
    return `${this.sidebarWidth}px`;
  }

  getPageWidth(): string {
    if (window.innerWidth <= 768) return '100%';
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getBreadcrumbLeft(): string {
    if (window.innerWidth <= 768) return '0';
    return `${this.sidebarWidth}px`;
  }

  getBreadcrumbWidth(): string {
    if (window.innerWidth <= 768) return '100%';
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) return '100%';
    const padding = 48;
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.showPriorityDropdown = false;
      this.showRiskJobDropdown = false;
    }
  }

  //#endregion

  //#region Summary Card Actions

  onSummaryCardClick(card: JobSummaryCard): void {
    if (card.status === JobStatus.Pending) {
      this.currentViewMode = 'pending';
    } else if (card.status === JobStatus.Open) {
      this.currentViewMode = 'approved';
    } else if (card.status === JobStatus.Rejected) {
      this.currentViewMode = 'rejected';
    } else {
      return; // "Tổng số tin" không làm gì
    }

    this.currentPage = 1;
    this.selectedJob = null;
    this.loadJobPostings();
  }

  //#endregion

  //#region Filter & Dropdown (Pending View)

  togglePriorityDropdown(): void {
    this.showPriorityDropdown = !this.showPriorityDropdown;
    this.showRiskJobDropdown = false;
  }

  toggleRiskJobDropdown(): void {
    this.showRiskJobDropdown = !this.showRiskJobDropdown;
    this.showPriorityDropdown = false;
  }

  selectPriorityLevel(option: { label: string; value: any }): void {
    this.selectedPriorityLevel = option;
    this.showPriorityDropdown = false;
    this.currentPage = 1;
    this.loadJobPostings();
  }

  selectRiskJobLevel(option: { label: string; value: any }): void {
    this.selectedRiskJobLevel = option;
    this.showRiskJobDropdown = false;
    this.currentPage = 1;
    this.loadJobPostings();
  }

  //#endregion

  //#region Filter (Approved/Rejected View)

  onSearchFieldChange(): void {
    this.currentPage = 1;
    this.loadJobPostings();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadJobPostings();
  }

  //#endregion

  //#region Helper Methods

  onJobItemMouseEnter(jobId: string): void {
    this.hoveredJobId = jobId;
  }

  onJobItemMouseLeave(): void {
    this.hoveredJobId = null;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadJobPostings();
    const jobListElement = document.querySelector('.job-list');
    if (jobListElement) {
      jobListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getStatusBadgeClass(status: JobStatus): string {
    const statusMap: { [key: number]: string } = {
      [JobStatus.Pending]: 'status-badge pending',
      [JobStatus.Open]: 'status-badge approved',
      [JobStatus.Rejected]: 'status-badge rejected',
    };
    return statusMap[status] || 'status-badge';
  }

  getStatusLabel(status: JobStatus): string {
    const statusMap: { [key: number]: string } = {
      [JobStatus.Draft]: 'Nháp',
      [JobStatus.Pending]: 'Chờ duyệt',
      [JobStatus.Open]: 'Đã duyệt',
      [JobStatus.Closed]: 'Đã đóng',
      [JobStatus.Expired]: 'Hết hạn',
      [JobStatus.Rejected]: 'Từ chối',
      [JobStatus.Deleted]: 'Đã xóa',
    };
    return statusMap[status] || 'Không xác định';
  }

  getPriorityLevelLabel(level: JobPriorityLevel | undefined): string {
    if (level === undefined) return 'N/A';
    const levelMap: { [key: number]: string } = {
      [JobPriorityLevel.Low]: 'Thấp',
      [JobPriorityLevel.Medium]: 'Trung bình',
      [JobPriorityLevel.High]: 'Cao',
      [JobPriorityLevel.Urgent]: 'Khẩn cấp',
    };
    return levelMap[level] || 'N/A';
  }

  getRiskJobLevelLabel(level: RiskJobLevel | undefined): string {
    if (level === undefined) return 'N/A';
    const levelMap: { [key: number]: string } = {
      [RiskJobLevel.Low]: 'Thấp',
      [RiskJobLevel.Normal]: 'Trung bình',
      [RiskJobLevel.Hight]: 'Cao',
      [RiskJobLevel.NonCalculated]: 'Chưa tính',
    };
    return levelMap[level] || 'N/A';
  }

  getEmploymentTypeLabel(type: EmploymentType | undefined): string {
    if (type === undefined) return 'N/A';
    const typeMap: { [key: number]: string } = {
      [EmploymentType.PartTime]: 'Bán thời gian',
      [EmploymentType.FullTime]: 'Toàn thời gian',
      [EmploymentType.Internship]: 'Thực tập',
      [EmploymentType.Contract]: 'Hợp đồng',
      [EmploymentType.Freelance]: 'Tự do',
      [EmploymentType.Other]: 'Khác',
    };
    return typeMap[type] || 'N/A';
  }

  getPositionTypeLabel(type: PositionType | undefined): string {
    if (type === undefined) return 'N/A';
    const typeMap: { [key: number]: string } = {
      [PositionType.Employee]: 'Nhân viên',
      [PositionType.TeamLead]: 'Trưởng nhóm',
      [PositionType.Manager]: 'Quản lý',
      [PositionType.Supervisor]: 'Giám sát',
      [PositionType.BranchManager]: 'Quản lý chi nhánh',
      [PositionType.DeputyDirector]: 'Phó giám đốc',
      [PositionType.Director]: 'Giám đốc',
      [PositionType.Intern]: 'Thực tập sinh',
      [PositionType.Specialist]: 'Chuyên viên',
      [PositionType.SeniorSpecialist]: 'Chuyên viên cao cấp',
      [PositionType.Expert]: 'Chuyên gia',
      [PositionType.Consultant]: 'Tư vấn viên',
    };
    return typeMap[type] || 'N/A';
  }

  getExperienceLevelLabel(level: ExperienceLevel | undefined): string {
    if (level === undefined) return 'N/A';
    const levelMap: { [key: number]: string } = {
      [ExperienceLevel.None]: 'Không yêu cầu',
      [ExperienceLevel.Under1]: 'Dưới 1 năm',
      [ExperienceLevel.Year1]: '1 năm',
      [ExperienceLevel.Year2]: '2 năm',
      [ExperienceLevel.Year3]: '3 năm',
      [ExperienceLevel.Year4]: '4 năm',
      [ExperienceLevel.Year5]: '5 năm',
      [ExperienceLevel.Year6]: '6 năm',
      [ExperienceLevel.Year7]: '7 năm',
      [ExperienceLevel.Year8]: '8 năm',
      [ExperienceLevel.Year9]: '9 năm',
      [ExperienceLevel.Year10]: '10 năm',
      [ExperienceLevel.Over10]: 'Trên 10 năm',
    };
    return levelMap[level] || 'N/A';
  }

  getSalaryRangeText(job: JobApproveViewDto | JobViewManageDetailDto): string {
    if (job.salaryDeal) return 'Thỏa thuận';
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} VNĐ`;
    }
    if (job.salaryMin) return `Từ ${job.salaryMin.toLocaleString()} VNĐ`;
    if (job.salaryMax) return `Đến ${job.salaryMax.toLocaleString()} VNĐ`;
    return 'Thỏa thuận';
  }

  getLocationText(job: JobApproveViewDto | JobViewManageDetailDto): string {
    if ('provinceName' in job) {
      // JobApproveViewDto có provinceName và wardName
      const locations: string[] = [];
      if (job.wardName) locations.push(job.wardName);
      if (job.provinceName) locations.push(job.provinceName);
      
      if (locations.length > 0) {
        return locations.join(', ');
      }
      
      // Strip HTML từ workLocation nếu có
      if (job.workLocation) {
        return this.stripHtml(job.workLocation) || 'Chưa cập nhật';
      }
      
      return 'Chưa cập nhật';
    }
    // JobViewManageDetailDto chỉ có workLocation - cần strip HTML
    if (job.workLocation) {
      return this.stripHtml(job.workLocation) || 'Chưa cập nhật';
    }
    return 'Chưa cập nhật';
  }

  /**
   * Strip HTML tags để lấy text thuần
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Type guard helpers
  isPendingJob(job: JobApproveViewDto | JobViewManageDetailDto): job is JobApproveViewDto {
    return 'categoryName' in job;
  }

  isManagedJob(job: JobApproveViewDto | JobViewManageDetailDto): job is JobViewManageDetailDto {
    return 'approvedBy' in job;
  }

  //#endregion

  //#region Job Management

  private updateSummaryCounts(): void {
    this.loadSummaryCounts();
  }

  getCompanyLogoUrl(job: JobApproveViewDto | JobViewManageDetailDto): string {
    if (job.companyImageUrl) {
      return job.companyImageUrl;
    }
    const firstLetter = (job.companyName || 'C').charAt(0).toUpperCase();
    const svg = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#F3F4F6" rx="8"/><text x="50%" y="50%" font-size="24" font-weight="700" fill="#6B7280" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif">${firstLetter}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  onCloseDetail(): void {
    this.selectedJob = null;
  }

  viewDetail(posting: JobApproveViewDto | JobViewManageDetailDto): void {
    this.router.navigate(['/employee/manage-recruitment-information-detail'], {
      queryParams: { id: posting.id },
    });
  }

  onJobItemClick(posting: JobApproveViewDto | JobViewManageDetailDto): void {
    this.selectedJob = posting;
  }

  //#endregion

  //#region Approve/Reject (Only for Pending Jobs)

  onApprove(): void {
    if (!this.selectedJob || !this.isPendingJob(this.selectedJob)) return;
    
    const targetId = this.selectedJob.id ? String(this.selectedJob.id) : '';
    if (!targetId) return;

    this.jobPostService.approveJobPost(targetId).subscribe({
      next: () => {
        this.showSuccessToast('Đã duyệt tin tuyển dụng thành công');
        this.onCloseDetail();
        this.updateSummaryCounts();
        this.loadJobPostings();
      },
      error: () => {
        this.showErrorToast('Duyệt tin tuyển dụng thất bại');
      }
    });
  }

  onReject(): void {
    if (!this.selectedJob || !this.isPendingJob(this.selectedJob)) return;
    this.showRejectModal = true;
    this.rejectReason = this.selectedJob.rejectedReason || '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  onSubmitReject(): void {
    if (!this.selectedJob || !this.isPendingJob(this.selectedJob)) return;
    
    const targetId = this.selectedJob.id ? String(this.selectedJob.id) : '';
    if (!targetId || !this.rejectReason.trim()) {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
      return;
    }

    // Thêm rejectReason vào API call
    this.jobPostService.rejectJobPost(targetId, this.rejectReason).subscribe({
      next: () => {
        this.showSuccessToast('Đã từ chối tin tuyển dụng thành công');
        this.onCloseRejectModal();
        this.onCloseDetail();
        this.updateSummaryCounts();
        this.loadJobPostings();
      },
      error: () => {
        this.showErrorToast('Từ chối tin tuyển dụng thất bại');
      }
    });
  }

  onViewRejectReason(posting: JobApproveViewDto | JobViewManageDetailDto): void {
    this.viewingRejectReasonJob = posting;
    this.showViewRejectReasonModal = true;
    this.editingRejectReason = false;
    this.rejectReason = posting.rejectedReason || '';
  }

  onCloseViewRejectReasonModal(): void {
    this.showViewRejectReasonModal = false;
    this.editingRejectReason = false;
    this.rejectReason = '';
    this.viewingRejectReasonJob = null;
  }

  onEditRejectReason(): void {
    this.editingRejectReason = true;
  }

  onSaveRejectReason(): void {
    if (this.viewingRejectReasonJob && this.rejectReason.trim()) {
      this.editingRejectReason = false;
      this.showSuccessToast('Đã cập nhật lý do từ chối thành công');
      this.loadJobPostings();
    } else {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
    }
  }

  onCancelEditRejectReason(): void {
    this.editingRejectReason = false;
    this.rejectReason = this.viewingRejectReasonJob?.rejectedReason || '';
  }

  //#endregion

  //#region Toast

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  //#endregion
}