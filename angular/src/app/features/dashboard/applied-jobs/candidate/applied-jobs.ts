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
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ProfilePictureEditModal } from '../../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { AuthStateService } from '../../../../core/services/auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';

interface AppliedJob {
  id: string;
  companyLogoImage?: string;
  companyName: string;
  jobTitle: string;
  appliedDate: string;
  appliedTime: string;
  cvType: string;
  cvName: string;
  salary: string;
  status: 'viewed' | 'suitable' | 'not-suitable' | 'pending';
}

@Component({
  selector: 'app-applied-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ToastNotificationComponent, ProfilePictureEditModal],
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
    private authFacadeService: AuthFacadeService
  ) {}

  ngOnInit(): void {
    this.loadAppliedJobs();
    this.loadProfileData();
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
      companyLogoImage: undefined,
      companyName: app.companyName || '',
      jobTitle: app.jobTitle || '',
      appliedDate,
      appliedTime,
      cvType: app.cvType || '',
      cvName,
      salary,
      status
    };
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
    this.showToastMessage('Đang mở CV...', 'info');
  }

  onJobSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.jobSearchEnabled = target.checked;
    const message = this.jobSearchEnabled 
      ? 'Đã bật tìm việc thành công' 
      : 'Đã tắt tìm việc thành công';
    this.showToastMessage(message, 'success');
  }

  onAllowRecruiterSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.allowRecruiterSearch = target.checked;
    const message = this.allowRecruiterSearch 
      ? 'Đã bật cho phép NTD tìm kiếm hồ sơ' 
      : 'Đã tắt cho phép NTD tìm kiếm hồ sơ';
    this.showToastMessage(message, 'success');
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

