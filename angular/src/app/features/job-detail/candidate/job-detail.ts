import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { SearchHeaderComponent } from '../../../shared/components/search-header/search-header';
import { ApplyJobModalComponent } from '../../../shared/components/apply-job-modal/apply-job-modal';
import { LoginModalComponent } from '../../../shared/components/login-modal/login-modal';
import {
  JobApiService,
  EmploymentType,
  PositionType,
  EducationLevel,
  JobViewDetail,
  CategoryItemDto,
} from '../../../apiTest/api/job.service';
import { CompanyService, CompanyInfoForJobDetailDto } from '../../../apiTest/api/company.service';
import { Router } from '@angular/router';
import { CategoryApiService, CategoryTreeDto } from '../../../apiTest/api/category.service';
import { environment } from '../../../../environments/environment';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ToastNotificationComponent,
    SearchHeaderComponent,
    ApplyJobModalComponent,
    LoginModalComponent,
  ],
  templateUrl: './job-detail.html',
  styleUrls: ['./job-detail.scss'],
})
export class JobDetailComponent implements OnInit {
  selectedLanguage: string = 'vi';
  isHeartActive: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  selectedCategory: string = '';
  selectedLocation: string = '';
  searchPosition: string = '';
  showApplyModal: boolean = false;
  showLoginModal: boolean = false;
  isAuthenticated: boolean = false;

  // Job data from API
  jobDetail: JobViewDetail | null = null;
  isLoading: boolean = false;
  jobId: string = '';

  // Company data from API
  companyInfo: CompanyInfoForJobDetailDto | null = null;
  isLoadingCompany: boolean = false;
  companyError: boolean = false;

  constructor(
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private jobApi: JobApiService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private categoryApi: CategoryApiService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Check authentication status
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isAuthenticated = isLoggedIn;
      console.log('[JobDetail] isLoggedIn =', isLoggedIn);
    });

    // Get job ID from route params
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      console.log('[JobDetail] route jobId =', this.jobId);
      if (this.jobId) {
        this.loadJobDetail();
      } else {
        // Fallback: Lấy jobId từ URL nếu route params chưa có
        const urlPath = window.location.pathname;
        const match = urlPath.match(/\/candidate\/job-detail\/([^\/]+)/);
        if (match && match[1]) {
          this.jobId = match[1];
          console.log('[JobDetail] Fallback: jobId from URL =', this.jobId);
          this.loadJobDetail();
        }
      }
    });
  }

  /**
   * Load job detail from API
   */
  loadJobDetail() {
    this.isLoading = true;

    this.jobApi.getJobById(this.jobId).subscribe({
      next: (jobDetail: JobViewDetail) => {
        console.log('[JobDetail] getJobById result =', jobDetail);
        console.log('gia tri cua isSaved  =', jobDetail.isSaved);
        this.jobDetail = jobDetail;
        this.isLoading = false;

        // Load company info after job detail is loaded
        this.loadCompanyInfo();

        // Ưu tiên lấy từ DTO nếu có
        // if (typeof jobDetail.isSaved === 'boolean') {
        this.isHeartActive = jobDetail.isSaved;
        console.log('[JobDetail] isSaved from DTO =', jobDetail.isSaved);
        // } else {
        //   console.log('[JobDetail] DTO missing isSaved → calling loadSavedStatus');
        //   this.loadSavedStatus();
        // }

        // Load saved status if authenticated
        // if (this.isAuthenticated) {
        //   // Ưu tiên lấy từ DTO nếu có
        //   if (typeof jobDetail.isSaved === 'boolean') {
        //     this.isHeartActive = jobDetail.isSaved;
        //     console.log('[JobDetail] isSaved from DTO =', jobDetail.isSaved);
        //   } else {
        //     console.log('[JobDetail] DTO missing isSaved → calling loadSavedStatus');
        //     this.loadSavedStatus();
        //   }
        // } else {
        //   this.isHeartActive = false;
        // }
      },
      error: error => {
        console.error('❌ Error loading job detail:', error);
        this.isLoading = false;
        this.toastMessage = 'Không thể tải chi tiết công việc';
        this.showToast = true;
      },
    });
  }

  /**
   * Load company info from API by job ID
   */
  loadCompanyInfo() {
    if (!this.jobId) {
      return;
    }

    this.isLoadingCompany = true;
    this.companyError = false;

    this.companyService.getCompanyByJobId(this.jobId).subscribe({
      next: (companyInfo: CompanyInfoForJobDetailDto) => {
        // Clean up data - remove single quotes if present
        if (
          companyInfo.companyName &&
          typeof companyInfo.companyName === 'string' &&
          companyInfo.companyName.startsWith("'") &&
          companyInfo.companyName.endsWith("'")
        ) {
          companyInfo.companyName = companyInfo.companyName.slice(1, -1);
        }
        if (
          companyInfo.logoUrl &&
          typeof companyInfo.logoUrl === 'string' &&
          companyInfo.logoUrl.startsWith("'") &&
          companyInfo.logoUrl.endsWith("'")
        ) {
          companyInfo.logoUrl = companyInfo.logoUrl.slice(1, -1);
        }
        if (
          companyInfo.headquartersAddress &&
          typeof companyInfo.headquartersAddress === 'string' &&
          companyInfo.headquartersAddress.startsWith("'") &&
          companyInfo.headquartersAddress.endsWith("'")
        ) {
          companyInfo.headquartersAddress = companyInfo.headquartersAddress.slice(1, -1);
        }

        // Set company info
        this.companyInfo = { ...companyInfo };
        this.isLoadingCompany = false;
        this.companyError = false;

        // Force change detection
        this.cdr.detectChanges();
      },
      error: error => {
        this.isLoadingCompany = false;
        this.companyError = true;
        this.companyInfo = null;
      },
    });
  }

  /**
   * Format company size to display text
   * Example: 1 -> "1-10 nhân viên", 2 -> "25-99 nhân viên", etc.
   */
  formatCompanySize(size: number): string {
    // Mapping các giá trị CompanySize sang text
    // Bạn có thể điều chỉnh mapping này dựa trên logic business của bạn
    const sizeMap: { [key: number]: string } = {
      1: '1-10 nhân viên',
      2: '25-99 nhân viên',
      3: '100-499 nhân viên',
      4: '500-999 nhân viên',
      5: '1000+ nhân viên',
    };

    // Nếu size >= 1000, hiển thị 1000+
    if (size >= 1000) {
      return '1000+ nhân viên';
    }

    return sizeMap[size] || `${size} nhân viên`;
  }

  // ===== Enum → Vietnamese helpers =====
  getEmploymentTypeVi(value: EmploymentType | number | undefined): string {
    switch (value) {
      case EmploymentType.PartTime:
        return 'Bán thời gian';
      case EmploymentType.FullTime:
        return 'Toàn thời gian';
      case EmploymentType.Internship:
        return 'Thực tập';
      case EmploymentType.Contract:
        return 'Hợp đồng';
      case EmploymentType.Freelance:
        return 'Tự do';
      case EmploymentType.Other:
        return 'Khác';
      default:
        return 'Không xác định';
    }
  }

  getPositionTypeVi(value: PositionType | number | undefined): string {
    switch (value) {
      case PositionType.Employee:
        return 'Nhân viên';
      case PositionType.TeamLead:
        return 'Trưởng nhóm';
      case PositionType.Manager:
        return 'Quản lí';
      case PositionType.Supervisor:
        return 'Giám sát';
      case PositionType.BranchManager:
        return 'Trưởng chi nhánh';
      case PositionType.DeputyDirector:
        return 'Phó giám đốc';
      case PositionType.Director:
        return 'Giám đốc';
      case PositionType.Intern:
        return 'Thực tập sinh';
      case PositionType.Specialist:
        return 'Chuyên viên';
      case PositionType.SeniorSpecialist:
        return 'Chuyên viên tài chính';
      case PositionType.Expert:
        return 'Chuyên gia';
      case PositionType.Consultant:
        return 'Tư vấn';
      default:
        return 'Không xác định';
    }
  }

  getEducationLevelVi(value: EducationLevel | number | undefined): string {
    switch (value) {
      case EducationLevel.Any:
        return 'Không yêu cầu';
      case EducationLevel.HighSchool:
        return 'THPT trở lên';
      case EducationLevel.College:
        return 'Cao đẳng trở lên';
      case EducationLevel.University:
        return 'Đại học trở lên';
      case EducationLevel.Master:
        return 'Thạc sĩ trở lên';
      case EducationLevel.Doctor:
        return 'Tiến sĩ trở lên';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Get full logo URL từ backend wwwroot
   * Nếu logoUrl đã là full URL (http/https) → dùng trực tiếp
   * Nếu logoUrl là relative path (bắt đầu bằng /) → thêm base URL của backend
   */
  getLogoUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return '/assets/images/default-company-logo.png';
    }

    // Remove single quotes if present
    let cleanUrl = logoUrl.trim();
    if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'")) {
      cleanUrl = cleanUrl.slice(1, -1);
    }

    // Nếu đã là full URL, return as is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Nếu bắt đầu bằng /, đó là relative path từ wwwroot
    if (cleanUrl.startsWith('/')) {
      const backendBaseUrl = this.getBackendBaseUrl();
      return `${backendBaseUrl}${cleanUrl}`;
    }

    // Nếu không bắt đầu bằng /, prepend / và thêm backend URL
    const backendBaseUrl = this.getBackendBaseUrl();
    return `${backendBaseUrl}/${cleanUrl}`;
  }

  /**
   * Lấy base URL của backend từ environment
   */
  private getBackendBaseUrl(): string {
    const backendUrl = environment.apis?.default?.url || 'https://localhost:44385';
    return backendUrl.replace(/\/$/, '');
  }

  // ================= Related Categories → Navigate to Job List =================
  onRelatedCategoryClick(cat: CategoryItemDto, event: Event) {
    // Prevent default <a> navigation to allow async processing
    event.preventDefault();

    this.categoryApi.getCategoryTree().subscribe({
      next: (tree: CategoryTreeDto[]) => {
        const node = this.findNodeById(tree, cat.id);
        const leafIds = node ? this.collectLeafIds(node) : [];

        const queryParams: any = {};
        if (leafIds.length > 0) {
          queryParams.categoryIds = leafIds.join(',');
        }

        this.router.navigate(['/candidate/job'], { queryParams });
      },
      error: _ => {
        // Fallback: navigate by slug if tree load fails
        this.router.navigate(['/candidate/job'], { queryParams: { category: cat.slug } });
      },
    });
  }

  private findNodeById(tree: CategoryTreeDto[], id: string): CategoryTreeDto | null {
    for (const n of tree) {
      if (n.categoryId === id) return n;
      if (n.children && n.children.length > 0) {
        const found = this.findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private collectLeafIds(node: CategoryTreeDto): string[] {
    if (!node.children || node.children.length === 0 || node.isLeaf) {
      return [node.categoryId];
    }
    let ids: string[] = [];
    for (const child of node.children) {
      ids = ids.concat(this.collectLeafIds(child));
    }
    return ids;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  /**
   * Load saved job status from API
   */
  loadSavedStatus() {
    if (!this.jobId) return;

    const tokenDebug =
      localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    console.log('[JobDetail] loadSavedStatus token exists =', !!tokenDebug);

    this.jobApi.getSavedJobStatus(this.jobId).subscribe({
      next: status => {
        this.isHeartActive = status.isSaved;
        console.log('[JobDetail] loadSavedStatus ->', status);
        this.cdr.detectChanges();
      },
      error: error => {
        // Silently fail - user might not be authenticated
        console.error('[JobDetail] Error loading saved status:', error);
      },
    });
  }

  /**
   * Toggle heart (save/unsave job)
   * If not authenticated, show login modal
   */
  toggleHeart(): void {
    if (!this.isAuthenticated) {
      // Show login modal
      this.showLoginModal = true;
      return;
    }

    if (!this.jobId) return;

    if (this.isHeartActive) {
      // Unsave job
      this.jobApi.unsaveJob(this.jobId).subscribe({
        next: () => {
          this.isHeartActive = false;
          this.showToastMessage('Đã bỏ lưu công việc', 'success');
        },
        error: error => {
          console.error('Error unsaving job:', error);
          this.showToastMessage('Không thể bỏ lưu công việc', 'error');
        },
      });
    } else {
      // Save job
      this.jobApi.saveJob(this.jobId).subscribe({
        next: () => {
          this.isHeartActive = true;
          this.showToastMessage('Đã lưu công việc thành công', 'success');
        },
        error: error => {
          console.error('Error saving job:', error);
          this.showToastMessage('Không thể lưu công việc', 'error');
        },
      });
    }
  }

  /**
   * Handle login success - reload saved status
   */
  onLoginSuccess() {
    this.showLoginModal = false;
    this.isAuthenticated = true;
    // Đợi một chút để đảm bảo modal đã đóng và state đã cập nhật
    setTimeout(() => {
      // Reload lại trang job detail để load lại data với token mới
      const currentUrl = window.location.href;
      console.log('[JobDetail] Reloading page with URL:', currentUrl);
      // Đảm bảo URL có jobId trước khi reload
      if (this.jobId || currentUrl.includes('/candidate/job-detail/')) {
        window.location.reload();
      } else {
        console.error('[JobDetail] Cannot reload: jobId not found in URL');
      }
    }, 100);
  }

  /**
   * Close login modal
   */
  closeLoginModal() {
    this.showLoginModal = false;
  }

  /**
   * Show toast message
   */
  showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.showToast = true;
    this.toastType = type;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  toggleHeartOld(): void {
    this.isHeartActive = !this.isHeartActive;
    if (this.isHeartActive) {
      this.toastMessage = this.translate('job_detail.save_success');
    } else {
      this.toastMessage = this.translate('job_detail.unsave_success');
    }
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value;
  }

  onLocationChange(event: any): void {
    this.selectedLocation = event.target.value;
  }

  onPositionChange(event: any): void {
    this.searchPosition = event.target.value;
  }

  onSearch(): void {
    console.log('Search with params:', {
      category: this.selectedCategory,
      location: this.selectedLocation,
      position: this.searchPosition,
    });
  }

  onClearPosition(): void {
    this.searchPosition = '';
  }

  openApplyModal(): void {
    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  onModalSubmit(data: { success: boolean; message: string }): void {
    if (data.success) {
      this.toastType = 'success';
      this.toastMessage = data.message;
      this.showToast = true;
      // Reload job detail to update apply count
      this.loadJobDetail();
    } else {
      this.toastType = 'error';
      this.toastMessage = data.message;
      this.showToast = true;
    }
  }
}
