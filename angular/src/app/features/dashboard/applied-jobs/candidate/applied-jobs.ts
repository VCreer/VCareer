import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TranslationService } from '../../../../core/services/translation.service';
import { ApplicationService } from '../../../../proxy/http-api/controllers/application.service';
import type { ApplicationDto, GetApplicationListDto } from '../../../../proxy/dto/applications/models';
import type { ProfileDto } from '../../../../proxy/dto/profile/models';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ProfilePictureEditModal } from '../../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { AuthStateService } from '../../../../core/services/auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';
import { EnableJobSearchModalComponent } from '../../../../shared/components/enable-job-search-modal/enable-job-search-modal';
import { JobSearchService } from '../../../../proxy/services/job/job-search.service';
import { CompanyLegalInfoService } from '../../../../proxy/services/profile/company-legal-info.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AppliedJob {
  id: string;
  companyLogoImage?: string;
  companyName: string;
  jobTitle: string;
  appliedDate: string;
  appliedTime: string;
  cvType: string;
  cvName: string;
  cvId?: string; // ID của CV để xem chi tiết
  uploadedCvId?: string; // ID của CV upload (nếu có)
  candidateCvId?: string; // ID của CV online (nếu có)
  salary: string;
  status: 'viewed' | 'suitable' | 'not-suitable' | 'pending';
  jobId?: string; // Để load logo công ty
}

@Component({
  selector: 'app-applied-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ToastNotificationComponent, ProfilePictureEditModal, EnableJobSearchModalComponent],
  templateUrl: './applied-jobs.html',
  styleUrls: ['./applied-jobs.scss']
})
export class AppliedJobsComponent implements OnInit {
  appliedJobs: AppliedJob[] = [];
  filteredJobs: AppliedJob[] = [];
  displayedJobs: AppliedJob[] = [];
  loading: boolean = false;
  selectedStatus: string = 'all';
  showStatusDropdown: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 1;
  
  statusOptions = [
    { value: 'all', label: 'Trạng thái' },
    { value: 'applied', label: 'Đã ứng tuyển' },
    { value: 'viewed', label: 'NTD đã xem hồ sơ' },
    { value: 'suitable', label: 'Hồ sơ phù hợp' },
    { value: 'not-suitable', label: 'Hồ sơ chưa phù hợp' }
  ];
  
  get selectedStatusLabel(): string {
    return this.statusOptions.find(opt => opt.value === this.selectedStatus)?.label || 'Trạng thái';
  }
  
  // Profile management
  profileData = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    location: ''
  };
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;
  showProfilePictureModal: boolean = false;
  isLoadingProfile: boolean = false;
  showEnableJobSearchModal: boolean = false;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private applicationService: ApplicationService,
    private http: HttpClient,
    private authStateService: AuthStateService,
    private authFacadeService: AuthFacadeService,
    private profileService: ProfileService,
    private jobSearchService: JobSearchService,
    private companyLegalInfoService: CompanyLegalInfoService
  ) {}

  ngOnInit(): void {
    this.loadAppliedJobs();
    this.loadProfileData();

    // Đồng bộ trạng thái "Đang bật/tắt tìm việc" từ localStorage (FE-only)
    const savedJobSearch = localStorage.getItem('vcareer_job_search_enabled');
    if (savedJobSearch !== null) {
      this.jobSearchEnabled = savedJobSearch === 'true';
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  loadAppliedJobs(): void {
    this.loading = true;

    const input: GetApplicationListDto = {
      skipCount: 0,
      maxResultCount: 50,
      sorting: 'CreationTime DESC'
    };

    this.applicationService.getMyApplications(input).subscribe({
      next: (result) => {
        const items = result?.items ?? [];
        this.appliedJobs = items.map(app => this.mapApplicationToAppliedJob(app));
        
        // Load logo công ty cho tất cả jobs
        this.loadCompanyLogos();
        
        this.filteredJobs = this.appliedJobs;
        this.currentPage = 1;
        this.updateDisplayedJobs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.appliedJobs = [];
        this.filteredJobs = [];
        this.updateDisplayedJobs();
      }
    });
  }

  private mapApplicationToAppliedJob(app: ApplicationDto): AppliedJob {
    const created = app.creationTime ? new Date(app.creationTime) : null;

    const appliedDate = created
      ? `${created.getDate().toString().padStart(2, '0')}-${(created.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${created.getFullYear()}`
      : '';

    const appliedTime = created
      ? `${created.getHours().toString().padStart(2, '0')}:${created
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      : '';

    const cvName =
      app.cvType === 'Online'
        ? app.candidateCvName || 'CV online'
        : app.uploadedCvName || 'CV tải lên';

    // Lấy CV ID để link đến trang xem CV
    const cvId = app.cvType === 'Online' 
      ? app.candidateCvId 
      : app.uploadedCvId;

    const salary = app.jobSalaryText || '';

    let status: AppliedJob['status'] = 'pending';

    // Ưu tiên trạng thái đã xem hồ sơ
    if (app.viewedAt) {
      status = 'viewed';
    } else if (app.status) {
      // Trạng thái từ phía nhà tuyển dụng (đồng bộ với cv-management-detail)
      if (['suitable', 'interview', 'offer', 'hired'].includes(app.status)) {
        status = 'suitable'; // Hồ sơ phù hợp
      } else if (app.status === 'not-suitable') {
        status = 'not-suitable'; // Hồ sơ chưa phù hợp
      }
    }

    return {
      id: app.id ?? '',
      companyLogoImage: 'assets/images/home/company-placeholder.png', // Default logo, sẽ được update nếu có logoUrl
      companyName: app.companyName || '',
      jobTitle: app.jobTitle || '',
      appliedDate,
      appliedTime,
      cvType: app.cvType || '',
      cvName,
      cvId: cvId || undefined,
      uploadedCvId: app.uploadedCvId || undefined,
      candidateCvId: app.candidateCvId || undefined,
      salary,
      status,
      jobId: app.jobId // Lưu jobId để load logo
    };
  }

  /**
   * Load company logos cho tất cả applied jobs từ logoUrl trong bảng Companies
   */
  private loadCompanyLogos(): void {
    // Lấy danh sách jobId duy nhất
    const uniqueJobIds = [...new Set(this.appliedJobs.map(job => (job as any).jobId).filter(id => id))];
    
    if (uniqueJobIds.length === 0) {
      return;
    }

    // Load company info từ jobId để lấy logoUrl từ bảng Companies
    const companyRequests = uniqueJobIds.map(jobId =>
      this.companyLegalInfoService.getCompanyByJobId(jobId).pipe(
        catchError(error => {
          console.error(`Error loading company for job ${jobId}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(companyRequests).subscribe(companies => {
      // Tạo map jobId -> logo
      const logoMap = new Map<string, string>();
      
      uniqueJobIds.forEach((jobId, index) => {
        const company = companies[index];
        if (company && company.logoUrl && company.logoUrl.trim() !== '') {
          // Format logoUrl từ bảng Companies
          logoMap.set(jobId, this.formatCompanyLogoUrl(company.logoUrl));
        }
      });

      // Cập nhật logo cho các applied jobs
      this.appliedJobs.forEach(job => {
        const jobId = (job as any).jobId;
        if (jobId && logoMap.has(jobId)) {
          job.companyLogoImage = logoMap.get(jobId);
        } else {
          // Nếu không có logo, set default từ assets/images/home/company-placeholder.png
          job.companyLogoImage = 'assets/images/home/company-placeholder.png';
        }
      });

      // Update lại filteredJobs và displayedJobs
      this.filteredJobs = [...this.appliedJobs];
      this.updateDisplayedJobs();
    });
  }

  /**
   * Format logo URL của công ty
   */
  private formatCompanyLogoUrl(logoUrl: string | undefined | null): string {
    if (!logoUrl || logoUrl.trim() === '') {
      return '';
    }

    let cleanUrl = logoUrl.trim().replace(/^'|'$/g, '');
    
    if (cleanUrl === '') {
      return '';
    }

    // Nếu đã là full URL (http/https), return as is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Logo được lưu trong blob storage với StoragePath
    const baseUrl = environment.apis?.default?.url || (window as any).environment?.apis?.default?.url || 'https://localhost:44385';
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const encodedStoragePath = encodeURIComponent(cleanUrl);
    return `${normalizedBase}/api/profile/company-legal-info/company-logo?storagePath=${encodedStoragePath}`;
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.onStatusChange();
  }

  onStatusChange(): void {
    if (this.selectedStatus === 'all') {
      this.filteredJobs = this.appliedJobs;
    } else if (this.selectedStatus === 'applied') {
      this.filteredJobs = this.appliedJobs;
    } else if (this.selectedStatus === 'viewed') {
      this.filteredJobs = this.appliedJobs.filter(job => job.status === 'viewed');
    } else if (this.selectedStatus === 'suitable') {
      this.filteredJobs = this.appliedJobs.filter(job => job.status === 'suitable');
    } else if (this.selectedStatus === 'not-suitable') {
      this.filteredJobs = this.appliedJobs.filter(job => job.status === 'not-suitable');
    }
    this.currentPage = 1;
    this.updateDisplayedJobs();
  }

  updateDisplayedJobs(): void {
    this.totalPages = Math.ceil(this.filteredJobs.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedJobs = this.filteredJobs.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedJobs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedJobs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedJobs();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-filter')) {
      this.showStatusDropdown = false;
    }
  }

  onViewCV(job: AppliedJob): void {
    if (!job.cvId) {
      this.showToastMessage('Không tìm thấy CV', 'error');
      return;
    }

    // Debug: log để kiểm tra giá trị
    console.log('onViewCV - cvType:', job.cvType, 'uploadedCvId:', job.uploadedCvId, 'candidateCvId:', job.candidateCvId, 'cvId:', job.cvId);

    // Kiểm tra CV type: chỉ navigate nếu cvType === 'Online' và có candidateCvId
    // Tất cả các trường hợp khác đều mở blob URL
    const isOnlineCv = job.cvType === 'Online' && job.candidateCvId && job.candidateCvId === job.cvId;
    
    if (isOnlineCv) {
      // CV online: navigate trong cùng tab
      console.log('Navigating to CV online view');
      this.router.navigate(['/candidate/cv-management/view', job.cvId]);
    } else {
      // CV upload: load PDF và mở blob URL trong tab mới (KHÔNG navigate)
      console.log('Opening uploaded CV as blob URL');
      this.loadAndOpenUploadedCv(job.cvId);
    }
  }

  /**
   * Load PDF từ API và mở blob URL trong tab mới
   */
  private loadAndOpenUploadedCv(cvId: string): void {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const baseUrl = environment.apis?.default?.url || (window as any).environment?.apis?.default?.url || 'https://localhost:44385';
    
    // Download PDF từ API
    this.http.get(`${baseUrl}/api/cv/uploaded/${cvId}/download`, {
      responseType: 'blob',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).subscribe({
      next: (blob: Blob) => {
        // Tạo blob URL từ PDF
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Mở blob URL trong tab mới
        window.open(blobUrl, '_blank');
      },
      error: (error) => {
        console.error('Error loading uploaded CV:', error);
        this.showToastMessage('Không thể tải CV', 'error');
      }
    });
  }

  /**
   * Xử lý click vào cv-link
   */
  onCvLinkClick(job: AppliedJob, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Gọi hàm xem CV (sẽ tự động phân biệt CV online và CV upload)
    this.onViewCV(job);
  }

  onJobSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      // Hiển thị modal chọn CV trước khi bật tìm việc
      this.showEnableJobSearchModal = true;
      target.checked = false;
      this.jobSearchEnabled = false;
    } else {
      // Tắt tìm việc trực tiếp
      this.profileService.updateJobStatus(false).subscribe({
        next: () => {
          this.jobSearchEnabled = false;
          localStorage.setItem('vcareer_job_search_enabled', 'false');
          this.showToastMessage('Đã tắt tìm việc thành công', 'success');
        },
        error: () => {
          target.checked = true;
          this.jobSearchEnabled = true;
          this.showToastMessage('Không thể tắt tìm việc. Vui lòng thử lại.', 'error');
        }
      });
    }
  }

  onAllowRecruiterSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;

    // Gọi API để update ProfileVisibility
    this.profileService.updateProfileVisibility(newValue).subscribe({
      next: () => {
        this.allowRecruiterSearch = newValue;
        const message = this.allowRecruiterSearch 
          ? 'Đã bật cho phép NTD tìm kiếm hồ sơ' 
          : 'Đã tắt cho phép NTD tìm kiếm hồ sơ';
        this.showToastMessage(message, 'success');
      },
      error: (error) => {
        console.error('Error updating profile visibility:', error);
        // Revert toggle nếu có lỗi
        target.checked = !newValue;
        this.showToastMessage('Không thể cập nhật cài đặt. Vui lòng thử lại.', 'error');
      }
    });
  }

  onCloseEnableJobSearchModal(): void {
    this.showEnableJobSearchModal = false;
  }

  onEnableJobSearch(selectedCvIds: string[]): void {
    this.profileService.updateJobStatus(true).subscribe({
      next: () => {
        this.jobSearchEnabled = true;
        localStorage.setItem('vcareer_job_search_enabled', 'true');
        this.showToastMessage('Đã bật tìm việc thành công!', 'success');
        this.showEnableJobSearchModal = false;
      },
      error: () => {
        this.showToastMessage('Không thể bật tìm việc. Vui lòng thử lại.', 'error');
      }
    });
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  navigateToJobSuggestionSettings(): void {
    this.router.navigate(['/candidate/job-suggestion-settings']);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  trackByJobId(index: number, job: AppliedJob): string {
    return job.id;
  }

  openProfilePictureModal(): void {
    this.showProfilePictureModal = true;
  }

  closeProfilePictureModal(): void {
    this.showProfilePictureModal = false;
  }

  onProfilePictureChange(): void {
    this.closeProfilePictureModal();
    this.showToastMessage('Đã cập nhật ảnh đại diện thành công', 'success');
  }

  onProfilePictureDelete(): void {
    this.closeProfilePictureModal();
    this.showToastMessage('Đã xóa ảnh đại diện thành công', 'success');
  }

  loadProfileData(): void {
    this.isLoadingProfile = true;
    
    // Với cookies, kiểm tra user từ AuthStateService
    if (!this.authStateService.user) {
      this.authFacadeService.loadCurrentUser().subscribe({
        next: (user) => {
          // Đã có user, tiếp tục load profile
          this.loadProfileDataInternal();
        },
        error: (err) => {
          // Không có cookies hợp lệ, không load profile
          this.isLoadingProfile = false;
        }
      });
      return;
    }

    // Đã có user, load profile
    this.loadProfileDataInternal();
  }

  private loadProfileDataInternal(): void {
    this.isLoadingProfile = true;
    
    const apiUrl = `${environment.apis.default.url}/api/profile`;
    this.http.get<ProfileDto>(apiUrl, {
      withCredentials: true,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).subscribe({
      next: (response) => {
        if (!response) {
          this.profileData = {
            fullName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            gender: '',
            address: '',
            location: ''
          };
          this.isLoadingProfile = false;
          return;
        }

        this.profileData = {
          fullName: `${response.name || ''} ${response.surname || ''}`.trim() || 'User',
          email: response.email || '',
          phone: response.phoneNumber || '',
          dateOfBirth: response.dateOfBirth ? response.dateOfBirth.split('T')[0] : '',
          gender: response.gender === true ? 'male' : (response.gender === false ? 'female' : ''),
          address: response.location || response.address || '',
          location: response.location || ''
        };

        // Đồng bộ trạng thái "Cho phép NTD tìm kiếm hồ sơ" từ ProfileVisibility
        const anyResponse: any = response as any;
        if (anyResponse.profileVisibility !== undefined && anyResponse.profileVisibility !== null) {
          this.allowRecruiterSearch = anyResponse.profileVisibility;
        }

        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.profileData = {
          fullName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          location: ''
        };
        this.isLoadingProfile = false;
      }
    });
  }
}

