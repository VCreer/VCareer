import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar';
import { ApplyJobModalComponent } from '../../../shared/components/apply-job-modal/apply-job-modal';
import { JobListComponent } from '../../../shared/components/job-list/job-list';
import { LoginModalComponent } from '../../../shared/components/login-modal/login-modal';

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
import { ProvinceDto } from 'src/app/proxy/dto/geo-dto/models';
import { GeoService as CoreGeoService } from 'src/app/core/services/Geo.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ToastNotificationComponent,
    FilterBarComponent,
    ApplyJobModalComponent,
    JobListComponent,
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
  selectedCategoryIds: string[] = [];
  selectedProvinceCodes: number[] = [];
  selectedWardCodes: number[] = [];
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

  // Provinces for search header
  provinces: ProvinceDto[] = [];

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
    private geoService: GeoService,
    private coreGeoService: CoreGeoService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Check authentication status first
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isAuthenticated = isLoggedIn;
      if (isLoggedIn && this.jobId) {
        this.loadSavedStatus();
      } else {
        this.hasApplied = false;
        this.isHeartActive = false;
      }
    });

    // Load category tree and provinces once (should work without authentication)
    this.loadCategoryTree();
    this.loadProvinces();

    // Get job ID from route params
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      if (this.jobId) {
        this.loadJobDetail();
      } else {
        // Fallback: Lấy jobId từ URL nếu route params chưa có
        const urlPath = window.location.pathname;
        const match = urlPath.match(/\/job-detail\/([^\/]+)/);
        if (match && match[1]) {
          this.jobId = match[1];
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
        this.categoryTree = tree || [];
        console.log('Category tree loaded successfully:', this.categoryTree.length, 'categories');
        // Reload job categories if job detail is already loaded
        if (this.jobDetail && this.jobDetail.jobCategoryId) {
          this.loadJobCategories();
        }
      },
      error: error => {
        // Error loading category tree - log but don't give up
        console.error('Error loading category tree:', error);
        this.categoryTree = [];
        // Retry loading category tree after a delay (might be network issue or auth issue)
        setTimeout(() => {
          if (this.categoryTree.length === 0) {
            console.log('Retrying to load category tree...');
            this.jobCategoryService.getCategoryTree().subscribe({
              next: (tree: CategoryTreeDto[]) => {
                this.categoryTree = tree || [];
                console.log('Category tree loaded on retry:', this.categoryTree.length, 'categories');
                if (this.jobDetail && this.jobDetail.jobCategoryId) {
                  this.loadJobCategories();
                }
              },
              error: retryError => {
                console.error('Retry failed to load category tree:', retryError);
                // Even if retry fails, try to load categories if we have job detail
                // Maybe the category info is available elsewhere
                if (this.jobDetail && this.jobDetail.jobCategoryId) {
                  this.loadJobCategories();
                }
              },
            });
          }
        }, 1000);
      },
    });
  }

  /**
   * Load provinces from API for search header
   */
  loadProvinces() {
    this.coreGeoService.getProvinces().subscribe({
      next: (provinces: ProvinceDto[]) => {
        this.provinces = provinces;
      },
      error: error => {
        // Error loading provinces
      },
    });
  }

  /**
   * Load job detail from API
   */
  loadJobDetail() {
    this.isLoading = true;

    this.jobSearchService.getJobById(this.jobId, { skipHandleError: true }).subscribe({
      next: (jobDetail: JobViewDetail) => {
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
        //  this.checkApplicationStatus();
        }
      },
      error: error => {
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
    if (!this.jobDetail) {
      this.provinceName = '';
      this.wardName = '';
      return;
    }

    const requests: any = {};

    // Load province name
    if (this.jobDetail.provinceCode) {
      requests.province = this.geoService.getProvinceNameByCodeByProvinceCode(
        this.jobDetail.provinceCode
      ).pipe(
        catchError(err => {
          // Nếu API lỗi, trả về empty string
          return of('');
        })
      );
    }

    // Load ward name if available
    if (this.jobDetail.wardCode && this.jobDetail.provinceCode) {
      requests.ward = this.geoService.getWardNameByCodeByWardCodeAndProvinceCode(
        this.jobDetail.wardCode,
        this.jobDetail.provinceCode
      ).pipe(
        catchError(err => {
          // Nếu API lỗi, trả về empty string
          return of('');
        })
      );
    }

    if (Object.keys(requests).length > 0) {
      forkJoin(requests).subscribe({
        next: (results: any) => {
          this.provinceName = results.province || '';
          this.wardName = results.ward || '';
          this.cdr.detectChanges();
        },
        error: error => {
          // Nếu forkJoin lỗi, reset về empty và trigger change detection
          this.provinceName = '';
          this.wardName = '';
          this.cdr.detectChanges();
        },
      });
    } else {
      // Nếu không có provinceCode, reset về empty
      this.provinceName = '';
      this.wardName = '';
      this.cdr.detectChanges();
    }
  }

  /**
   * Load job categories from jobCategoryId
   */
  loadJobCategories() {
    if (!this.jobDetail?.jobCategoryId) {
      this.jobCategories = [];
      this.cdr.detectChanges();
      return;
    }

    // If category tree is not loaded yet, wait for it with retry mechanism
    if (this.categoryTree.length === 0) {
      // Retry loading category tree if it failed before
      // This handles the case when API call failed due to authentication or network issues
      setTimeout(() => {
        if (this.categoryTree.length === 0 && this.jobDetail?.jobCategoryId) {
          // Try to reload category tree one more time
          this.loadCategoryTree();
          // Also retry loading categories after a delay
          setTimeout(() => {
            this.loadJobCategories();
          }, 1000);
        }
      }, 500);
      return;
    }

    // Find category in tree
    const category = this.findCategoryById(this.categoryTree, this.jobDetail.jobCategoryId);
    if (category) {
      // Build category path (from root to current)
      const categoryPath = this.buildCategoryPath(this.categoryTree, this.jobDetail.jobCategoryId);
      this.jobCategories = categoryPath;
      console.log('Job categories loaded:', this.jobCategories);
    } else {
      // If category not found, log for debugging
      console.warn('Category not found for jobCategoryId:', this.jobDetail.jobCategoryId, 'Available categories:', this.categoryTree.length);
      this.jobCategories = [];
    }
    this.cdr.detectChanges();
  }

  /**
   * Find category by ID in tree
   */
  findCategoryById(tree: CategoryTreeDto[], id: string): CategoryTreeDto | null {
    if (!id) return null;
    
    // Convert both to string for comparison to handle type mismatches
    const idStr = String(id).trim();
    
    for (const node of tree) {
      const nodeIdStr = node.categoryId ? String(node.categoryId).trim() : '';
      if (nodeIdStr === idStr) return node;
      
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
    if (!targetId) return [];
    
    // Convert both to string for comparison
    const targetIdStr = String(targetId).trim();
    
    for (const node of tree) {
      const nodeIdStr = node.categoryId ? String(node.categoryId).trim() : '';
      if (nodeIdStr === targetIdStr) {
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
    const parts: string[] = [];
    if (this.wardName) parts.push(this.wardName);
    if (this.provinceName) parts.push(this.provinceName);
    if (parts.length > 0) {
      return parts.join(', ');
    }
    // Fallback: workLocation (strip HTML for tag display)
    if (this.jobDetail?.workLocation) {
      return this.stripHtml(this.jobDetail.workLocation);
    }
    return 'Không xác định';
  }

  /**
   * Strip HTML tags for plain text
   */
  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
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
    this.companyInfo = null; // Clear previous data

    this.companyService.getCompanyByJobId(this.jobId).pipe(
      catchError(err => {
        this.isLoadingCompany = false;
        this.companyError = true;
        this.companyInfo = null;
        this.cdr.detectChanges();
        return of(null);
      })
    ).subscribe({
      next: (companyInfo: CompanyInfoForJobDetailDto | null) => {
        if (!companyInfo) {
          this.isLoadingCompany = false;
          this.companyError = true;
          this.companyInfo = null;
          this.cdr.detectChanges();
          return;
        }

        // API đã trả về đúng structure, nhưng các field có thể null
        // Giữ nguyên dữ liệu từ API, chỉ clean up nếu cần
        const mappedCompanyInfo: CompanyInfoForJobDetailDto = {
          id: companyInfo.id,
          companyName: companyInfo.companyName || null,
          logoUrl: companyInfo.logoUrl || null,
          companySize: companyInfo.companySize !== undefined && companyInfo.companySize !== null ? companyInfo.companySize : null,
          headquartersAddress: companyInfo.headquartersAddress || null,
          industries: companyInfo.industries && Array.isArray(companyInfo.industries) && companyInfo.industries.length > 0 ? companyInfo.industries : [],
        };

        // Clean up data - remove single quotes if present
        if (
          mappedCompanyInfo.companyName &&
          typeof mappedCompanyInfo.companyName === 'string' &&
          mappedCompanyInfo.companyName.startsWith("'") &&
          mappedCompanyInfo.companyName.endsWith("'")
        ) {
          mappedCompanyInfo.companyName = mappedCompanyInfo.companyName.slice(1, -1);
        }
        if (
          mappedCompanyInfo.logoUrl &&
          typeof mappedCompanyInfo.logoUrl === 'string' &&
          mappedCompanyInfo.logoUrl.startsWith("'") &&
          mappedCompanyInfo.logoUrl.endsWith("'")
        ) {
          mappedCompanyInfo.logoUrl = mappedCompanyInfo.logoUrl.slice(1, -1);
        }
        if (
          mappedCompanyInfo.headquartersAddress &&
          typeof mappedCompanyInfo.headquartersAddress === 'string' &&
          mappedCompanyInfo.headquartersAddress.startsWith("'") &&
          mappedCompanyInfo.headquartersAddress.endsWith("'")
        ) {
          mappedCompanyInfo.headquartersAddress = mappedCompanyInfo.headquartersAddress.slice(1, -1);
        }

        this.companyInfo = mappedCompanyInfo;
        this.isLoadingCompany = false;
        this.companyError = false;
        this.cdr.detectChanges();
      },
      error: error => {
        // Fallback error handler (không nên vào đây nếu đã catch ở pipe)
        this.isLoadingCompany = false;
        this.companyError = true;
        this.companyInfo = null;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Load related jobs from API
   * Nếu không có related jobs, fallback sang tìm jobs cùng category
   */
  loadRelatedJobs() {
    if (!this.jobId) {
      this.relatedJobs = [];
      this.isLoadingRelatedJobs = false;
      return;
    }

    this.isLoadingRelatedJobs = true;
    this.relatedJobs = []; // Clear previous data

    this.jobSearchService.getRelatedJobs(this.jobId, 7, { skipHandleError: true }).pipe(
      catchError(err => {
        // Nếu API lỗi (401, 404, etc.), thử fallback sang search jobs cùng category
        return this.loadJobsByCategoryFallback();
      })
    ).subscribe({
      next: (jobs: JobViewDto[]) => {
        if (jobs && jobs.length > 0) {
          // Loại bỏ job hiện tại khỏi danh sách
          this.relatedJobs = jobs.filter(job => job.id !== this.jobId).slice(0, 7);
        } else {
          // Nếu không có related jobs, thử fallback sang jobs cùng category
          this.loadJobsByCategoryFallback().subscribe({
            next: (fallbackJobs: JobViewDto[]) => {
              this.relatedJobs = fallbackJobs || [];
              this.isLoadingRelatedJobs = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.relatedJobs = [];
              this.isLoadingRelatedJobs = false;
              this.cdr.detectChanges();
            }
          });
          return; // Return early, sẽ set loading = false trong fallback
        }
        this.isLoadingRelatedJobs = false;
        this.cdr.detectChanges();
      },
      error: error => {
        // Fallback error handler (không nên vào đây nếu đã catch ở pipe)
        this.isLoadingRelatedJobs = false;
        this.relatedJobs = [];
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Fallback: Load jobs cùng category nếu không có related jobs
   */
  private loadJobsByCategoryFallback() {
    if (!this.jobDetail?.jobCategoryId) {
      return of([]);
    }

    const input: any = {
      categoryIds: [this.jobDetail.jobCategoryId],
      skipCount: 0,
      maxResultCount: 8, // Lấy 8 để sau khi filter job hiện tại còn ~7
    };

    return this.jobSearchService.searchJobs(input, { skipHandleError: true }).pipe(
      catchError(err => {
        return of([]);
      }),
      // Map để loại bỏ job hiện tại và giới hạn số lượng
      map((jobs: JobViewDto[]) => {
        const filtered = jobs.filter(job => job.id !== this.jobId);
        return filtered.slice(0, 7);
      })
    );
  }

  /**
   * Format company size to display text
   */
  formatCompanySize(size: number | null | undefined): string {
    if (size === null || size === undefined) {
      return 'Chưa cập nhật';
    }

    const sizeMap: { [key: number]: string } = {
      0: 'Dưới 10 nhân viên',
      1: '10-24 nhân viên',
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
   * Ưu tiên hiển thị theo salaryMin/salaryMax; chỉ trả về "Thỏa thuận" khi không có số.
   */
  formatSalary(job: JobViewDetail): string {
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
   * Map ExperienceLevel enum values to Vietnamese text
   */
  getExperienceText(experience: number | undefined): string {
    if (experience === undefined || experience === null) return 'Không yêu cầu';
    
    const experienceMap: { [key: number]: string } = {
      0: 'Không yêu cầu',      // None
      1: 'Dưới 1 năm',         // Under1
      2: '1 năm',            // Year1
      3: '2 năm',             // Year2
      4: '3 năm',             // Year3
      5: '4 năm',             // Year4
      6: '5 năm',             // Year5
      7: '6 năm',             // Year6
      8: '7 năm',             // Year7
      9: '8 năm',             // Year8
      10: '9 năm',           // Year9
      11: '10 năm',              // Year10
      12: 'Trên 10 năm',        // Over10
    };

    return experienceMap[experience] || 'Không yêu cầu';
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
   * Get full logo URL từ backend API endpoint
   * Logo được lưu trong blob storage với StoragePath (ví dụ: recruiter/logos/xxx.jpg)
   * Cần dùng endpoint API để serve file thay vì load trực tiếp từ blob storage
   */
  getLogoUrl(logoUrl: string | undefined | null): string {
    if (!logoUrl || logoUrl.trim() === '') {
      return 'assets/images/home/company-placeholder.png';
    }

    let cleanUrl = logoUrl.trim().replace(/^'|'$/g, '');
    if (cleanUrl === '') {
      return 'assets/images/home/company-placeholder.png';
    }

    // Nếu đã là full URL (http/https), return as is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Sử dụng API endpoint để lấy logo từ blob storage
    const baseUrl = environment.apis?.default?.url || (window as any).environment?.apis?.default?.url || 'https://localhost:44385';
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const encodedStoragePath = encodeURIComponent(cleanUrl);
    return `${normalizedBase}/api/profile/company-legal-info/company-logo?storagePath=${encodedStoragePath}`;
  }

  /**
   * Get company initials for logo fallback
   */
  getCompanyInitials(companyName: string | null | undefined): string {
    if (!companyName || !companyName.trim()) {
      return 'SM';
    }
    
    // Remove extra spaces and get first 2 characters
    const cleaned = companyName.trim().replace(/\s+/g, ' ');
    const words = cleaned.split(' ');
    
    if (words.length >= 2) {
      // Lấy chữ cái đầu của 2 từ đầu tiên
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else {
      // Nếu chỉ có 1 từ, lấy 2 ký tự đầu
      return cleaned.substring(0, 2).toUpperCase();
    }
  }

  /**
   * Get industries text for display
   */
  getIndustriesText(industries: string[] | null | undefined): string {
    if (!industries || industries.length === 0) {
      return 'Chưa cập nhật';
    }
    return industries.join(', ');
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

    this.jobSearchService
      .getSavedJobStatus(this.jobId, { skipHandleError: true })
      .subscribe({
        next: status => {
          this.isHeartActive = status.isSaved;
          this.cdr.detectChanges();
        },
        error: error => {
          // swallow error to avoid ABP modal
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
      this.jobSearchService.unsaveJob(this.jobId, { skipHandleError: true }).subscribe({
        next: () => {
          this.isHeartActive = false;
          this.showToastMessage('Đã bỏ lưu công việc', 'success');
        },
        error: error => {
          this.showToastMessage('Không thể bỏ lưu công việc', 'error');
        },
      });
    } else {
      this.jobSearchService.saveJob(this.jobId, { skipHandleError: true }).subscribe({
        next: () => {
          this.isHeartActive = true;
          this.showToastMessage('Đã lưu công việc thành công', 'success');
        },
        error: error => {
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
          this.loadSavedStatus();
        }
        const currentUrl = window.location.href;
        if (this.jobId || currentUrl.includes('/candidate/job-detail/')) {
          window.location.reload();
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

  onCategorySelected(ids: string[]): void {
    this.selectedCategoryIds = ids;
  }

  onLocationSelected(loc: { provinceIds: number[]; districtIds: number[] }): void {
    this.selectedProvinceCodes = loc.provinceIds;
    this.selectedWardCodes = loc.districtIds;
  }

  onSearch(event?: Event): void {
    // Ngăn chặn default behavior nếu có event
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Navigate to job search page with filters
    const queryParams: any = {};
    if (this.searchPosition) {
      queryParams.keyword = this.searchPosition;
    }
    if (this.selectedCategoryIds.length > 0) {
      queryParams.categoryIds = this.selectedCategoryIds.join(',');
    }
    if (this.selectedProvinceCodes.length > 0) {
      queryParams.provinceIds = this.selectedProvinceCodes.join(',');
    }
    if (this.selectedWardCodes.length > 0) {
      queryParams.districtIds = this.selectedWardCodes.join(',');
    }
    
    // Điều hướng về trang danh sách việc làm public (route: path 'job' ở root)
    this.router.navigate(['/job'], { queryParams });
  }

  openApplyModal(): void {
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      this.cdr.detectChanges();
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
      //  this.checkApplicationStatus();
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
        this.hasApplied = false;
      },
    });
  }

  /**
   * Navigate to related job detail
   */
  navigateToJob(job: any): void {
    // job có thể là string (jobId) hoặc object (JobViewDto)
    const jobId = typeof job === 'string' ? job : job?.id;
    if (!jobId) return;
    
    this.router.navigate(['/job-detail', jobId]).then(() => {
      window.scrollTo(0, 0);
    });
  }
}