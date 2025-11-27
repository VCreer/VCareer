import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { SearchHeaderComponent } from '../../../shared/components/search-header/search-header';
import { ApplyJobModalComponent } from '../../../shared/components/apply-job-modal/apply-job-modal';

import { CompanyService, CompanyInfoForJobDetailDto } from '../../../apiTest/api/company.service';
import { environment } from '../../../../environments/environment';
import { NavigationService } from '../../../core/services/navigation.service';
import { ApplicationService } from '../../../proxy/http-api/controllers/application.service';
import { JobViewDetail } from 'src/app/proxy/dto/job';
import { JobSearchService } from 'src/app/proxy/services/job';
import { JobViewDto } from 'src/app/proxy/dto/job-dto';
import { EmploymentType } from 'src/app/proxy/constants/job-constant/employment-type.enum';
import { PositionType } from 'src/app/proxy/constants/job-constant/position-type.enum';
import { GeoService } from 'src/app/proxy/services/geo';
import { JobCategoryService } from 'src/app/proxy/services/job';
import { CategoryTreeDto } from 'src/app/proxy/dto/category';
import { forkJoin } from 'rxjs';

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
  hasApplied: boolean = false;

  // Job data from API
  jobDetail: JobViewDetail | null = null;
  isLoading: boolean = false;
  jobId: string = '';

  // Company data from API
  companyInfo: CompanyInfoForJobDetailDto | null = null;
  isLoadingCompany: boolean = false;
  companyError: boolean = false;

  // Related jobs
  relatedJobs: JobViewDto[] = [];
  isLoadingRelatedJobs: boolean = false;

  // Location names
  provinceName: string = '';
  wardName: string = '';

  // Category data
  categoryTree: CategoryTreeDto[] = [];
  jobCategories: any[] = [];

  constructor(
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private jobSearchService: JobSearchService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private jobCategoryService: JobCategoryService,
    private navigationService: NavigationService,
    private applicationService: ApplicationService,
    private geoService: GeoService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Load category tree once
    this.loadCategoryTree();

    // Check authentication status
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isAuthenticated = isLoggedIn;
      console.log('[JobDetail] isLoggedIn =', isLoggedIn);
      if (isLoggedIn && this.jobId) {
        this.checkApplicationStatus();
        this.loadSavedStatus();
      } else {
        this.hasApplied = false;
        this.isHeartActive = false;
      }
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
   * Load category tree from API
   */
  loadCategoryTree() {
    this.jobCategoryService.getCategoryTree().subscribe({
      next: (tree: CategoryTreeDto[]) => {
        this.categoryTree = tree;
        console.log('[JobDetail] Category tree loaded:', tree);
      },
      error: error => {
        console.error('❌ Error loading category tree:', error);
      },
    });
  }

  /**
   * Load job detail from API
   */
  loadJobDetail() {
    this.isLoading = true;

    this.jobSearchService.getJobById(this.jobId).subscribe({
      next: (jobDetail: JobViewDetail) => {
        console.log('[JobDetail] getJobById result =', jobDetail);
        this.jobDetail = jobDetail;
        this.isLoading = false;

        // Load location names
        this.loadLocationNames();

        // Load job categories
        this.loadJobCategories();

        // Load company info after job detail is loaded
        this.loadCompanyInfo();

        // Load related jobs
        this.loadRelatedJobs();

        // Load saved status if authenticated
        if (this.isAuthenticated) {
          this.loadSavedStatus();
        }

        // Check application status if authenticated
        if (this.isAuthenticated && this.jobId) {
          this.checkApplicationStatus();
        }
      },
      error: error => {
        console.error('❌ Error loading job detail:', error);
        this.isLoading = false;
        this.toastMessage = 'Không thể tải chi tiết công việc';
        this.toastType = 'error';
        this.showToast = true;
      },
    });
  }

  /**
   * Load location names from provinceCode and wardCode
   */
  loadLocationNames() {
    if (!this.jobDetail) return;

    const requests: any = {};

    // Load province name
    if (this.jobDetail.provinceCode) {
      requests.province = this.geoService.getProvinceNameByCodeByProvinceCode(
        this.jobDetail.provinceCode
      );
    }

    // Load ward name if available
    if (this.jobDetail.wardCode && this.jobDetail.provinceCode) {
      requests.ward = this.geoService.getWardNameByCodeByWardCodeAndProvinceCode(
        this.jobDetail.wardCode,
        this.jobDetail.provinceCode
      );
    }

    if (Object.keys(requests).length > 0) {
      forkJoin(requests).subscribe({
        next: (results: any) => {
          this.provinceName = results.province || '';
          this.wardName = results.ward || '';
          console.log('[JobDetail] Location names loaded:', { provinceName: this.provinceName, wardName: this.wardName });
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('❌ Error loading location names:', error);
        },
      });
    }
  }

  /**
   * Load job categories from jobCategoryId
   */
  loadJobCategories() {
    if (!this.jobDetail?.jobCategoryId || this.categoryTree.length === 0) {
      return;
    }

    // Find category in tree
    const category = this.findCategoryById(this.categoryTree, this.jobDetail.jobCategoryId);
    if (category) {
      // Build category path (from root to current)
      this.jobCategories = this.buildCategoryPath(this.categoryTree, this.jobDetail.jobCategoryId);
      console.log('[JobDetail] Job categories loaded:', this.jobCategories);
      this.cdr.detectChanges();
    }
  }

  /**
   * Find category by ID in tree
   */
  findCategoryById(tree: CategoryTreeDto[], id: string): CategoryTreeDto | null {
    for (const node of tree) {
      if (node.categoryId === id) return node;
      if (node.children && node.children.length > 0) {
        const found = this.findCategoryById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Build category path from root to target category
   */
  buildCategoryPath(tree: CategoryTreeDto[], targetId: string): CategoryTreeDto[] {
    for (const node of tree) {
      if (node.categoryId === targetId) {
        return [node];
      }
      if (node.children && node.children.length > 0) {
        const childPath = this.buildCategoryPath(node.children, targetId);
        if (childPath.length > 0) {
          return [node, ...childPath];
        }
      }
    }
    return [];
  }

  /**
   * Get full location text (ward + province)
   */
  getFullLocation(): string {
    if (this.jobDetail?.workLocation) {
      return this.jobDetail.workLocation;
    }
    
    const parts: string[] = [];
    if (this.wardName) parts.push(this.wardName);
    if (this.provinceName) parts.push(this.provinceName);
    
    return parts.length > 0 ? parts.join(', ') : 'Không xác định';
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

        this.companyInfo = { ...companyInfo };
        this.isLoadingCompany = false;
        this.companyError = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('❌ Error loading company info:', error);
        this.isLoadingCompany = false;
        this.companyError = true;
        this.companyInfo = null;
      },
    });
  }

  /**
   * Load related jobs from API
   */
  loadRelatedJobs() {
    if (!this.jobId) {
      return;
    }

    this.isLoadingRelatedJobs = true;

    this.jobSearchService.getRelatedJobs(this.jobId, 6).subscribe({
      next: (jobs: JobViewDto[]) => {
        console.log('[JobDetail] getRelatedJobs result =', jobs);
        this.relatedJobs = jobs;
        this.isLoadingRelatedJobs = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('❌ Error loading related jobs:', error);
        this.isLoadingRelatedJobs = false;
        this.relatedJobs = [];
      },
    });
  }

  /**
   * Format company size to display text
   */
  formatCompanySize(size: number): string {
    const sizeMap: { [key: number]: string } = {
      1: '1-10 nhân viên',
      2: '25-99 nhân viên',
      3: '100-499 nhân viên',
      4: '500-999 nhân viên',
      5: '1000+ nhân viên',
    };

    if (size >= 1000) {
      return '1000+ nhân viên';
    }

    return sizeMap[size] || `${size} nhân viên`;
  }

  /**
   * Format salary text
   */
  formatSalary(job: JobViewDetail): string {
    if (job.salaryDeal) {
      return 'Thỏa thuận';
    }
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} VNĐ`;
    }
    if (job.salaryMin) {
      return `Từ ${job.salaryMin.toLocaleString()} VNĐ`;
    }
    if (job.salaryMax) {
      return `Lên tới ${job.salaryMax.toLocaleString()} VNĐ`;
    }
    return 'Thỏa thuận';
  }

  /**
   * Format experience level
   */
  getExperienceText(experience: number | undefined): string {
    if (!experience) return 'Không yêu cầu';
    
    const experienceMap: { [key: number]: string } = {
      0: 'Không yêu cầu',
      1: 'Dưới 1 năm',
      2: '1-2 năm',
      3: '2-5 năm',
      4: '5-10 năm',
      5: 'Trên 10 năm',
    };

    return experienceMap[experience] || `${experience} năm`;
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
        return 'Chuyên viên cao cấp';
      case PositionType.Expert:
        return 'Chuyên gia';
      case PositionType.Consultant:
        return 'Tư vấn';
      default:
        return 'Không xác định';
    }
  }

  getEducationLevelVi(value: number | undefined): string {
    const educationMap: { [key: number]: string } = {
      0: 'Không yêu cầu',
      1: 'THPT trở lên',
      2: 'Cao đẳng trở lên',
      3: 'Đại học trở lên',
      4: 'Thạc sĩ trở lên',
      5: 'Tiến sĩ trở lên',
    };

    return educationMap[value || 0] || 'Không xác định';
  }

  /**
   * Get full logo URL từ backend wwwroot
   */
  getLogoUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return '/assets/images/default-company-logo.png';
    }

    let cleanUrl = logoUrl.trim();
    if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'")) {
      cleanUrl = cleanUrl.slice(1, -1);
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith('/')) {
      const backendBaseUrl = this.getBackendBaseUrl();
      return `${backendBaseUrl}${cleanUrl}`;
    }

    const backendBaseUrl = this.getBackendBaseUrl();
    return `${backendBaseUrl}/${cleanUrl}`;
  }

  private getBackendBaseUrl(): string {
    const backendUrl = environment.apis?.default?.url || 'https://localhost:44385';
    return backendUrl.replace(/\/$/, '');
  }

  // ================= Related Categories → Navigate to Job List =================
  onRelatedCategoryClick(cat: CategoryTreeDto, event: Event) {
    event.preventDefault();

    // Collect leaf IDs from this category
    const leafIds = this.collectLeafIds(cat);

    const queryParams: any = {};
    if (leafIds.length > 0) {
      queryParams.categoryIds = leafIds.join(',');
    }

    this.router.navigate(['/candidate/job'], { queryParams });
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
    if (!this.jobId || !this.isAuthenticated) return;

    this.jobSearchService.getSavedJobStatus(this.jobId).subscribe({
      next: status => {
        this.isHeartActive = status.isSaved;
        console.log('[JobDetail] loadSavedStatus ->', status);
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('[JobDetail] Error loading saved status:', error);
      },
    });
  }

  /**
   * Toggle heart (save/unsave job)
   */
  toggleHeart(): void {
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      return;
    }

    if (!this.jobId) return;

    if (this.isHeartActive) {
      this.jobSearchService.unsaveJob(this.jobId).subscribe({
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
      this.jobSearchService.saveJob(this.jobId).subscribe({
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

  onLoginSuccess() {
    this.showLoginModal = false;
    this.isAuthenticated = true;
    setTimeout(() => {
      if (this.jobId) {
        this.checkApplicationStatus();
        this.loadSavedStatus();
      }
      const currentUrl = window.location.href;
      console.log('[JobDetail] Reloading page with URL:', currentUrl);
      if (this.jobId || currentUrl.includes('/candidate/job-detail/')) {
        window.location.reload();
      } else {
        console.error('[JobDetail] Cannot reload: jobId not found in URL');
      }
    }, 100);
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.showToast = true;
    this.toastType = type;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
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
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      return;
    }
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
      this.loadJobDetail();
      if (this.isAuthenticated && this.jobId) {
        this.checkApplicationStatus();
      }
    } else {
      this.toastType = 'error';
      this.toastMessage = data.message;
      this.showToast = true;
    }
  }

  checkApplicationStatus(): void {
    if (!this.jobId || !this.isAuthenticated) {
      this.hasApplied = false;
      return;
    }

    this.applicationService.checkApplicationStatus(this.jobId).subscribe({
      next: (status) => {
        this.hasApplied = status.hasApplied || false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[JobDetail] Error checking application status:', error);
        this.hasApplied = false;
      },
    });
  }

  /**
   * Navigate to related job detail
   */
  navigateToJob(jobId: string): void {
    this.router.navigate(['/candidate/job-detail', jobId]).then(() => {
      window.scrollTo(0, 0);
    });
  }
}