import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent } from '../../../../shared/components';
import { JobSearchService } from '../../../../proxy/services/job/job-search.service';
import { JobPostService } from '../../../../proxy/services/job/job-post.service';
import type { JobViewDetail } from '../../../../proxy/dto/job/models';
import type { JobApproveViewDto, JobViewManageDetailDto } from '../../../../proxy/dto/job-dto/models';

@Component({
  selector: 'app-employee-job-management-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent],
  templateUrl: './employee-job-management-detail.html',
  styleUrls: ['./employee-job-management-detail.scss'],
})
export class EmployeeJobManagementDetailComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 72; // Default collapsed sidebar width
  private sidebarCheckInterval?: any;
  private resizeObserver?: ResizeObserver;

  // Reject modal properties
  showRejectModal = false;
  rejectReason = '';

  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  jobId: string | null = null;
  job: JobViewDetail | JobApproveViewDto | JobViewManageDetailDto | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private jobSearchService: JobSearchService,
    private jobPostService: JobPostService
  ) {}

  ngOnInit(): void {
    // Initial check
    this.checkSidebarState();

    // Use ResizeObserver to detect sidebar width changes (including hover)
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkSidebarState();
      });
      this.resizeObserver.observe(sidebar);
    }

    // Also listen to mouse events on sidebar to catch hover state changes
    if (sidebar) {
      sidebar.addEventListener('mouseenter', () => this.checkSidebarState());
      sidebar.addEventListener('mouseleave', () => this.checkSidebarState());
    }

    // Periodic check as fallback (more frequent for hover detection)
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 50);

    // Get job ID from query params and load job detail
    this.route.queryParams.subscribe(params => {
      this.jobId = params['id'] || null;
      if (this.jobId) {
        this.loadJobDetail();
      }
    });
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
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
      // Always use the actual width from DOM (includes hover state)
      const newWidth = Math.round(width); // Round to avoid floating point issues

      // Always update to trigger change detection (needed for inline styles)
      if (this.sidebarWidth !== newWidth) {
        this.sidebarWidth = newWidth;
      }
    } else {
      // Default collapsed width if sidebar not found
      this.sidebarWidth = 72;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

  getModalPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getModalMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return 'calc(100% - 40px)';
    }
    const overlayPadding = 40;
    const availableWidth = viewportWidth - this.sidebarWidth - overlayPadding;
    return `${Math.min(500, availableWidth)}px`;
  }

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
    const padding = 48; // 24px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  onApprove(): void {
    if (!this.jobId) {
      this.showErrorToast('Không tìm thấy ID công việc');
      return;
    }

    this.jobPostService.approveJobPost(this.jobId).subscribe({
      next: () => {
        this.showSuccessToast('Đã duyệt tin tuyển dụng thành công');
        // Navigate back after a short delay
        setTimeout(() => {
          this.router.navigate(['/employee/manage-recruitment-information']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error approving job:', error);
        const errorMessage = error?.error?.error?.message || error?.message || 'Không thể duyệt tin tuyển dụng. Vui lòng thử lại.';
        this.showErrorToast(errorMessage);
      }
    });
  }

  onReject(): void {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  onSubmitReject(): void {
    if (!this.rejectReason.trim()) {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
      return;
    }

    if (!this.jobId) {
      this.showErrorToast('Không tìm thấy ID công việc');
      return;
    }

    this.jobPostService.rejectJobPost(this.jobId, this.rejectReason.trim()).subscribe({
      next: () => {
        this.showSuccessToast('Đã từ chối tin tuyển dụng thành công');
        this.onCloseRejectModal();
        // Navigate back after a short delay
        setTimeout(() => {
          this.router.navigate(['/employee/manage-recruitment-information']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error rejecting job:', error);
        const errorMessage = error?.error?.error?.message || error?.message || 'Không thể từ chối tin tuyển dụng. Vui lòng thử lại.';
        this.showErrorToast(errorMessage);
      }
    });
  }

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

  onBack(): void {
    this.router.navigate(['/employee/manage-recruitment-information']);
  }

  loadJobDetail(): void {
    if (!this.jobId) {
      return;
    }

    this.isLoading = true;
    
    // Try to load from job-search service first
    this.jobSearchService.getJobById(this.jobId).subscribe({
      next: (jobDetail: JobViewDetail) => {
        this.job = jobDetail;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading job detail:', error);
        // If job-search fails, try to load from list APIs
        this.loadJobFromList();
      }
    });
  }

  loadJobFromList(): void {
    if (!this.jobId) {
      return;
    }

    // Try loading from pending jobs (JobApproveViewDto)
    const filterDto = {
      priorityLevel: undefined,
      recruiterLevel: undefined,
      riskJobLevel: undefined,
      page: 1,
      pageSize: 1000
    };

    this.jobPostService.showJobPostNeedApproveByDto(filterDto).subscribe({
      next: (jobs: JobApproveViewDto[]) => {
        const foundJob = jobs.find(job => job.id === this.jobId);
        if (foundJob) {
          this.job = foundJob;
          this.isLoading = false;
          return;
        }
        // If not found in pending, try managed jobs
        this.loadManagedJob();
      },
      error: () => {
        this.loadManagedJob();
      }
    });
  }

  loadManagedJob(): void {
    if (!this.jobId) {
      return;
    }

    const requestDto = {
      searchField: undefined,
      status: undefined,
      startTime: undefined,
      endTime: undefined,
      page: 1,
      pageSize: 1000
    };

    this.jobPostService.getJobPostManageByDto(requestDto).subscribe({
      next: (jobs: JobViewManageDetailDto[]) => {
        const foundJob = jobs.find(job => job.id === this.jobId);
        if (foundJob) {
          this.job = foundJob;
        } else {
          this.showErrorToast('Không tìm thấy thông tin công việc');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading managed jobs:', error);
        this.showErrorToast('Không thể tải thông tin công việc');
        this.isLoading = false;
      }
    });
  }

  getCompanyLogoUrl(companyName?: string): string {
    if (!companyName) {
      return this.getDefaultLogo();
    }

    // Try to get logo image, fallback to placeholder
    const logoMap: { [key: string]: string } = {
      airCloset: 'assets/images/companies/aircloset.png',
      FOXAi: 'assets/images/companies/foxai.png',
      LIFESTYLE: 'assets/images/companies/lifestyle.png',
      Jarvis: 'assets/images/companies/jarvis.png',
    };

    // Check if company name contains any logo key
    for (const [key, url] of Object.entries(logoMap)) {
      if (companyName.toUpperCase().includes(key.toUpperCase())) {
        return url;
      }
    }

    return this.getDefaultLogo(companyName);
  }

  getDefaultLogo(companyName?: string): string {
    const firstLetter = companyName ? companyName.charAt(0).toUpperCase() : '?';
    const svg = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#F3F4F6" rx="8"/><text x="50%" y="50%" font-size="24" font-weight="700" fill="#6B7280" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif">${firstLetter}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  getSalaryText(): string {
    if (!this.job) return 'Thoả thuận';
    if (this.job.salaryDeal) return 'Thoả thuận';
    if (this.job.salaryMin && this.job.salaryMax) {
      return `${this.formatCurrency(this.job.salaryMin)} - ${this.formatCurrency(this.job.salaryMax)} VND`;
    }
    if (this.job.salaryMin) {
      return `Từ ${this.formatCurrency(this.job.salaryMin)} VND`;
    }
    return 'Thoả thuận';
  }

  getLocationText(): string {
    if (!this.job) return '';
    if ('workLocation' in this.job && this.job.workLocation) {
      return this.job.workLocation;
    }
    if ('provinceName' in this.job && this.job.provinceName) {
      return this.job.provinceName;
    }
    return '';
  }

  getExperienceText(): string {
    if (!this.job || !this.job.experience) return '';
    const experienceMap: { [key: number]: string } = {
      0: 'Chưa có kinh nghiệm',
      1: 'Dưới 1 năm',
      2: '1-2 năm',
      3: '2-3 năm',
      4: '3-5 năm',
      5: '5-7 năm',
      6: 'Trên 7 năm'
    };
    return experienceMap[this.job.experience] || '';
  }

  getEmploymentTypeText(): string {
    if (!this.job || !this.job.employmentType) return '';
    const typeMap: { [key: number]: string } = {
      0: 'Toàn thời gian',
      1: 'Bán thời gian',
      2: 'Thực tập',
      3: 'Hợp đồng',
      4: 'Tự do'
    };
    return typeMap[this.job.employmentType] || '';
  }

  getPositionTypeText(): string {
    if (!this.job || !this.job.positionType) return '';
    const typeMap: { [key: number]: string } = {
      0: 'Nhân viên',
      1: 'Trưởng nhóm',
      2: 'Trưởng phòng',
      3: 'Phó giám đốc',
      4: 'Giám đốc'
    };
    return typeMap[this.job.positionType] || 'Nhân viên';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }
}
