import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginationComponent, ToastNotificationComponent } from '../../../../shared/components';
import { JobApproveViewDto, JobFilterDto } from 'src/app/proxy/dto/job-dto';
import { JobPostService } from 'src/app/proxy/services/job';
import { JobStatus, JobPriorityLevel, RecruiterLevel, RiskJobLevel } from 'src/app/proxy/constants/job-constant';

interface JobSummaryCard {
  label: string;
  value: number;
  icon: string;
  borderColor: string;
}

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

  summaryCards: JobSummaryCard[] = [
    { label: 'Tổng số tin', value: 0, icon: 'fa fa-file-alt', borderColor: '#0F83BA' },
    { label: 'Chờ duyệt', value: 0, icon: 'fa fa-clock', borderColor: '#f59e0b' },
    { label: 'Đã duyệt', value: 0, icon: 'fa fa-check-circle', borderColor: '#10b981' },
    { label: 'Từ chối', value: 0, icon: 'fa fa-times-circle', borderColor: '#ef4444' },
  ];

  // Filter options
  priorityLevelOptions = [
    { label: 'Tất cả mức độ ưu tiên', value: null },
    { label: 'Thấp', value: JobPriorityLevel.Low},
    { label: 'Trung bình', value: JobPriorityLevel.Medium },
    { label: 'Cao', value: JobPriorityLevel.High },
    { label: 'Khẩn cấp', value: JobPriorityLevel.Urgent },
  ];

  recruiterLevelOptions = [
    { label: 'Tất cả cấp độ tuyển dụng', value: null },
    { label: 'Đã xác thực', value: RecruiterLevel.Verified },
    { label: 'Đáng tin', value: RecruiterLevel.Trusted },
    { label: 'Rất đáng tin', value: RecruiterLevel.Premium },
  ];

  riskJobLevelOptions = [
    { label: 'Tất cả mức độ rủi ro', value: null },
    { label: 'Thấp', value: RiskJobLevel.Low },
    { label: 'Trung bình', value: RiskJobLevel.Normal},
    { label: 'Cao', value: RiskJobLevel.Hight},
  ];

  selectedPriorityLevel = this.priorityLevelOptions[0];
  selectedRecruiterLevel = this.recruiterLevelOptions[0];
  selectedRiskJobLevel = this.riskJobLevelOptions[0];

  showPriorityDropdown = false;
  showRecruiterDropdown = false;
  showRiskJobDropdown = false;

  jobPostings: JobApproveViewDto[] = [];
  filteredPostings: JobApproveViewDto[] = [];
  itemsPerPage = 7;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  selectedJob: JobApproveViewDto | null = null;
  showRejectModal = false;
  rejectReason = '';
  hoveredJobId: number | null = null;
  showViewRejectReasonModal = false;
  editingRejectReason = false;
  viewingRejectReasonJob: JobApproveViewDto | null = null;
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

  private loadJobPostings(): void {
    this.isLoading = true;
    const filterDto: JobFilterDto = {
      priorityLevel: this.selectedPriorityLevel.value,
      recruiterLevel: this.selectedRecruiterLevel.value,
      riskJobLevel: this.selectedRiskJobLevel.value,
      page: this.currentPage,
      pageSize: this.itemsPerPage,
    };

    this.jobPostService.showJobPostNeedApproveByDto(filterDto).subscribe({
      next: (data) => {
        this.jobPostings = data;
        this.filteredPostings = data;
        this.totalItems = data.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
        this.updateSummaryCounts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading job postings:', error);
        this.showErrorToast('Không thể tải danh sách tin tuyển dụng');
        this.isLoading = false;
      },
    });
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
      this.showRecruiterDropdown = false;
      this.showRiskJobDropdown = false;
    }
  }

  //#endregion

  //#region Filter & Dropdown

  togglePriorityDropdown(): void {
    this.showPriorityDropdown = !this.showPriorityDropdown;
    this.showRecruiterDropdown = false;
    this.showRiskJobDropdown = false;
  }

  toggleRecruiterDropdown(): void {
    this.showRecruiterDropdown = !this.showRecruiterDropdown;
    this.showPriorityDropdown = false;
    this.showRiskJobDropdown = false;
  }

  toggleRiskJobDropdown(): void {
    this.showRiskJobDropdown = !this.showRiskJobDropdown;
    this.showPriorityDropdown = false;
    this.showRecruiterDropdown = false;
  }

  selectPriorityLevel(option: { label: string; value: any }): void {
    this.selectedPriorityLevel = option;
    this.showPriorityDropdown = false;
    this.currentPage = 1;
    this.loadJobPostings();
  }

  selectRecruiterLevel(option: { label: string; value: any }): void {
    this.selectedRecruiterLevel = option;
    this.showRecruiterDropdown = false;
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

  //#region Helper Methods

  onJobItemMouseEnter(jobId: number): void {
    this.hoveredJobId = jobId;
  }

  onJobItemMouseLeave(): void {
    this.hoveredJobId = null;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadJobPostings();
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
      [JobStatus.Pending]: 'Chờ duyệt',
      [JobStatus.Open]: 'Đã duyệt',
      [JobStatus.Rejected]: 'Từ chối',
    };
    return statusMap[status] || 'Không xác định';
  }

  getSalaryRangeText(job: JobApproveViewDto): string {
    if (job.salaryDeal) return 'Thỏa thuận';
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} VNĐ`;
    }
    if (job.salaryMin) return `Từ ${job.salaryMin.toLocaleString()} VNĐ`;
    if (job.salaryMax) return `Đến ${job.salaryMax.toLocaleString()} VNĐ`;
    return 'Thỏa thuận';
  }

  // getExperienceText(job: JobApproveViewDto): string {
  //   return job.experienceText || 'Không yêu cầu';
  // }

  getLocationText(job: JobApproveViewDto): string {
    return job.provinceName || job.workLocation || 'Chưa cập nhật';
  }

  //#endregion

  //#region Job Management

  private updateSummaryCounts(): void {
    const total = this.jobPostings.length;
    const pending = this.jobPostings.filter(p => p.status === JobStatus.Pending).length;
    const approved = this.jobPostings.filter(p => p.status === JobStatus.Open).length;
    const rejected = this.jobPostings.filter(p => p.status === JobStatus.Rejected).length;

    this.summaryCards[0].value = total;
    this.summaryCards[1].value = pending;
    this.summaryCards[2].value = approved;
    this.summaryCards[3].value = rejected;
  }

  getCompanyLogoUrl(job: JobApproveViewDto): string {
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

  viewDetail(posting: JobApproveViewDto): void {
    this.router.navigate(['/employee/manage-recruitment-information-detail'], {
      queryParams: { id: posting.id },
    });
  }

  onJobItemClick(posting: JobApproveViewDto): void {
    this.selectedJob = posting;
  }

  //#endregion

  //#region Approve/Reject

  onApprove(): void {
  if (!this.selectedJob) return;

  this.jobPostService.approveJobPost(this.selectedJob.id).subscribe({
    next: () => {
      this.showSuccessToast('Đã duyệt tin tuyển dụng thành công');
      this.loadJobPostings();
    },
    error: () => {
      this.showErrorToast('Duyệt tin tuyển dụng thất bại');
    }
  });
}


 onReject(): void {
  this.showRejectModal = true;
  this.rejectReason = this.selectedJob?.rejectedReason || '';
}


  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

 onSubmitReject(): void {
  if (!this.selectedJob || !this.rejectReason.trim()) {
    this.showErrorToast('Vui lòng nhập lý do từ chối');
    return;
  }

  this.jobPostService.rejectJobPost(this.selectedJob.id).subscribe({
    next: () => {
      this.showSuccessToast('Đã từ chối tin tuyển dụng thành công');
      this.onCloseRejectModal();
      this.loadJobPostings();
    },
    error: () => {
      this.showErrorToast('Từ chối tin tuyển dụng thất bại');
    }
  });
}


  onViewRejectReason(posting: JobApproveViewDto): void {
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
      // TODO: Call API to update reject reason
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