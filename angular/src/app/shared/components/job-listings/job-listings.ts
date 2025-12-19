import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { LoginModalComponent } from '../login-modal/login-modal';
import { TranslationService } from '../../../core/services/translation.service';
import { CategoryTreeDto } from '../../../apiTest/api/category.service';
import { ProvinceDto } from '../../../proxy/dto/geo-dto';
import { JobViewDto } from '../../../proxy/dto/job-dto/models';
import { EmploymentType } from '../../../proxy/constants/job-constant/employment-type.enum';
import { PositionType } from '../../../proxy/constants/job-constant/position-type.enum';
import { ExperienceLevel } from '../../../proxy/constants/job-constant/experience-level.enum';
import { JobSearchService } from '../../../proxy/services/job/job-search.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-listings',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent, LoginModalComponent], 
  templateUrl: './job-listings.html',
  styleUrls: ['./job-listings.scss']
})
export class JobListingsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() jobListings: JobViewDto[] = [];  
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() categories: CategoryTreeDto[] = [];  // ← NEW: Categories từ API
  @Input() provinces: ProvinceDto[] = [];       // ← NEW: Provinces từ API
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() jobClick = new EventEmitter<string>();  // ✅ Đổi thành string vì jobId là string
  @Output() categorySelected = new EventEmitter<string[]>();  // ← NEW
  @Output() locationSelected = new EventEmitter<{provinceIds: number[], districtIds: number[]}>();  // ← NEW
  // Event riêng cho auto paging để parent xử lý mà không scroll lên đầu
  @Output() autoPageChange = new EventEmitter<number>();

  defaultLogo = 'assets/images/home/company-placeholder.png';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  isAuthenticated = false;
  private autoPageInterval: any;
  showLoginModal = false;

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = this.defaultLogo;
  }

  toggleBookmark(job: any) {
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      return;
    }

    if (!job || !job.id) {
      return;
    }

    if (job.isBookmarked) {
      this.jobSearchService.unsaveJob(job.id, { skipHandleError: true }).subscribe({
        next: () => {
          job.isBookmarked = false;
          // Không cần toast khi bỏ lưu theo yêu cầu cũ
        },
        error: () => {
          this.toastType = 'error';
          this.toastMessage = 'Không thể bỏ lưu công việc';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 2500);
        }
      });
    } else {
      this.jobSearchService.saveJob(job.id, { skipHandleError: true }).subscribe({
        next: () => {
          job.isBookmarked = true;
          this.toastType = 'success';
          this.toastMessage = 'Lưu tin thành công';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 2500);
        },
        error: () => {
          this.toastType = 'error';
          this.toastMessage = 'Không thể lưu công việc';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 2500);
        }
      });
    }
  }

  /**
   * Đồng bộ trạng thái đã lưu cho danh sách job trên home
   */
  private syncSavedStatus() {
    if (!this.isAuthenticated || !this.jobListings?.length) {
      this.jobListings = this.jobListings.map(j => ({ ...j, isBookmarked: false }));
      return;
    }

    this.jobSearchService.getSavedJobs(0, 200, { skipHandleError: true }).subscribe({
      next: res => {
        const items = res.items || [];
        const savedIds = new Set(items.map(x => x.jobId));

        this.jobListings = this.jobListings.map(j => ({
          ...j,
          isBookmarked: savedIds.has(j.id as any)
        }));
      },
      error: err => {
        console.error('Error syncing saved status in JobListings:', err);
      }
    });
  }

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }

  onJobClick(jobId: string | undefined) {
    if (jobId) {
      this.jobClick.emit(jobId);
    }
  }

  onCategorySelected(categoryIds: string[]) {
    this.categorySelected.emit(categoryIds);
  }

  onLocationSelected(location: {provinceIds: number[], districtIds: number[]}) {
    this.locationSelected.emit(location);
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  onLoginSuccess() {
    this.showLoginModal = false;
    this.isAuthenticated = true;
    this.syncSavedStatus();
  }

  constructor(
    private translationService: TranslationService,
    private jobSearchService: JobSearchService,
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.navigationService.isLoggedIn$.subscribe(isLogged => {
      this.isAuthenticated = isLogged;

      // Đăng nhập: đồng bộ lại danh sách đã lưu từ backend
      if (isLogged) {
        this.syncSavedStatus();
      } else {
        // Đăng xuất: clear toàn bộ trạng thái tim trên UI
        this.jobListings = this.jobListings.map(j => ({ ...j, isBookmarked: false }));
      }
    });

    // Tự động chuyển trang cho phần job-listings (trang chủ)
    this.startAutoPaging();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['jobListings'] && this.isAuthenticated) {
      this.syncSavedStatus();
    }

    // Khi tổng số trang hoặc trang hiện tại thay đổi thì khởi động lại auto paging
    if (changes['totalPages'] || changes['currentPage']) {
      this.startAutoPaging();
    }
  }

  ngOnDestroy(): void {
    if (this.autoPageInterval) {
      clearInterval(this.autoPageInterval);
      this.autoPageInterval = null;
    }
  }
  translate(key: string): string { return this.translationService.translate(key); }

  getProvinceName(provinceCode: number): string {
    if (!this.provinces || this.provinces.length === 0) return '';
    const province = this.provinces.find(p => p.code === provinceCode);
    return province?.name || '';
  }

  getWardName(provinceCode: number, wardCode: number): string {
    if (!this.provinces || this.provinces.length === 0) return '';
    const province = this.provinces.find(p => p.code === provinceCode);
    if (!province || !province.wards || province.wards.length === 0) return '';
    const ward = province.wards.find(w => w.code === wardCode);
    return ward?.name || '';
  }

  getCategoryName(categoryId: string | undefined): string {
    if (!categoryId || !this.categories || this.categories.length === 0) return '';
    
    const findCategory = (cats: CategoryTreeDto[], id: string): CategoryTreeDto | null => {
      for (const cat of cats) {
        if (cat.categoryId === id) return cat;
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const category = findCategory(this.categories, categoryId);
    return category?.categoryName || '';
  }

  formatSalary(job: JobViewDto): string {
    if (job.salaryDeal) {
      return 'Thỏa thuận';
    }
    if (job.salaryMin && job.salaryMax) {
      return `${this.formatNumber(job.salaryMin)} - ${this.formatNumber(job.salaryMax)} VNĐ`;
    }
    if (job.salaryMin) {
      return `Từ ${this.formatNumber(job.salaryMin)} VNĐ`;
    }
    return 'Chưa cập nhật';
  }

  // Format số với dấu phẩy
  formatNumber(num: number): string {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('vi-VN');
  }

  //  Format employment type
  formatEmploymentType(type: EmploymentType | undefined): string {
    if (type === undefined || type === null) return '';
    const typeMap: { [key: number]: string } = {
      [EmploymentType.PartTime]: 'Bán thời gian',
      [EmploymentType.FullTime]: 'Toàn thời gian',
      [EmploymentType.Internship]: 'Thực tập',
      [EmploymentType.Contract]: 'Hợp đồng',
      [EmploymentType.Freelance]: 'Freelance',
      [EmploymentType.Other]: 'Khác'
    };
    return typeMap[type] || String(type);
  }

  //  Format position type
  formatPositionType(type: PositionType | undefined): string {
    if (type === undefined || type === null) return '';
    const typeMap: { [key: number]: string } = {
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
    return typeMap[type] || String(type);
  }

  // Format experience level
  formatExperience(level: ExperienceLevel | undefined): string {
    if (level === undefined || level === null) return '';
    const levelMap: { [key: number]: string } = {
      [ExperienceLevel.None]: 'Chưa có kinh nghiệm',
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
      [ExperienceLevel.Over10]: 'Trên 10 năm'
    };
    return levelMap[level] || String(level);
  }

  //  Format date
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  /**
   * Xử lý click "Xem tất cả" → chuyển sang trang danh sách việc làm
   */
  onViewAllClick(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/job']);
  }

  /**
   * Auto đổi trang: sau một khoảng thời gian sẽ tự động chuyển sang trang kế tiếp.
   * Chỉ hoạt động khi totalPages > 1.
   */
  private startAutoPaging(): void {
    // Clear interval cũ nếu có
    if (this.autoPageInterval) {
      clearInterval(this.autoPageInterval);
      this.autoPageInterval = null;
    }

    if (!this.totalPages || this.totalPages <= 1) {
      return;
    }

    // Mỗi 8 giây tự động nhảy sang trang tiếp theo
    this.autoPageInterval = setInterval(() => {
      if (!this.totalPages || this.totalPages <= 1) {
        return;
      }

      const nextPage =
        this.currentPage >= this.totalPages ? 1 : this.currentPage + 1;

      // Emit sự kiện autoPageChange để parent cập nhật data mà không scroll
      this.autoPageChange.emit(nextPage);
    }, 8000);
  }
}
