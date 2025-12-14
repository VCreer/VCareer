// src/app/pages/candidate/job/job.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

// Shared Components
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar';
import { JobFilterComponent } from '../../../shared/components/job-filter/job-filter';
import { JobListComponent } from '../../../shared/components/job-list/job-list';
import { JobListDetailComponent } from '../../../shared/components/job-list-detail/job-list-detail';
import { ApplyJobModalComponent } from '../../../shared/components/apply-job-modal/apply-job-modal';
import { ToastNotificationComponent } from '../../../shared/components';

// DTOs & Enums (từ ABP proxy)
import { CategoryTreeDto } from 'src/app/proxy/dto/category/models';
import { ProvinceDto } from 'src/app/proxy/dto/geo-dto/models';
import { JobViewDto, PagedResultDto } from 'src/app/proxy/dto/job-dto/models';
import {
  EmploymentType,
  ExperienceLevel,
  PositionType,
} from 'src/app/proxy/constants/job-constant';

// Proxy Services (ABP)
import { JobCategoryService } from 'src/app/proxy/services/job/job-category.service';
import { GeoService } from 'src/app/core/services/Geo.service';
import { JobSearchService } from 'src/app/proxy/services/job/job-search.service';
import { TranslationService } from 'src/app/core/services/translation.service';

@Component({
  selector: 'app-job',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterBarComponent,
    JobFilterComponent,
    JobListComponent,
    JobListDetailComponent,
    ApplyJobModalComponent,
    ToastNotificationComponent,
  ],
  templateUrl: './job.html',
  styleUrls: ['./job.scss'],
})
export class JobComponent implements OnInit {
  @ViewChild(JobListComponent) jobListComponent!: JobListComponent;
  @ViewChild(JobFilterComponent) jobFilterComponent!: JobFilterComponent;

  // === Dữ liệu cơ bản ===
  categories: CategoryTreeDto[] = [];
  provinces: ProvinceDto[] = [];
  jobs: JobViewDto[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  isSearching = false;
  isLoadingData = false;

  // === Bộ lọc chính (từ FilterBar và URL) ===
  searchKeyword = '';
  selectedCategoryIds: string[] = [];
  selectedProvinceCodes: number[] = [];
  selectedWardCodes: number[] = [];

  // === Bộ lọc nâng cao (từ JobFilter bên trái) ===
  selectedEmploymentTypes: EmploymentType[] = [];
  selectedExperienceLevel: ExperienceLevel | null = null;
  selectedSalaryFilter: number | null = null; // 1-7 (1: <10tr, 7: Thỏa thuận)
  selectedPositionTypes: PositionType[] = [];

  // === Chi tiết việc làm (quick view) ===
  selectedJob: JobViewDto | null = null;

  // Apply modal
  showApplyModal = false;
  applyJobId: string = '';
  applyJobTitle: string = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translationService: TranslationService,
    private categoryService: JobCategoryService,
    private geoService: GeoService,
    private jobSearchService: JobSearchService // ← ĐÚNG SERVICE PROXY
  ) {}

  ngOnInit(): void {
    this.loadInitialData();

    // Đọc query params từ URL (khi chuyển từ Homepage sang)
    this.route.queryParams.subscribe(params => {
      this.searchKeyword = params['keyword'] || '';
      this.selectedCategoryIds = params['categoryIds'] ? params['categoryIds'].split(',') : [];
      this.selectedProvinceCodes = params['provinceIds']
        ? params['provinceIds'].split(',').map(Number)
        : [];
      this.selectedWardCodes = params['districtIds']
        ? params['districtIds'].split(',').map(Number)
        : [];

      // Tìm kiếm ngay khi vào trang
      this.currentPage = 1;
      this.performJobSearch();
    });
  }

  // Load danh mục + tỉnh thành
  private loadInitialData(): void {
    this.isLoadingData = true;
    forkJoin({
      categories: this.categoryService.getCategoryTree(),
      provinces: this.geoService.getProvinces(),
    }).subscribe({
      next: ({ categories, provinces }) => {
        this.categories = categories;
        this.provinces = provinces;
        this.isLoadingData = false;
      },
      error: err => {
        this.isLoadingData = false;
      },
    });
  }

  // =================== TÌM KIẾM CHÍNH ===================
  performJobSearch(): void {
    this.isSearching = true; // bắt đầu loading
    this.jobs = []; // clear cũ (tùy chọn, tránh flash)

    const input: any = {
      keyword: this.searchKeyword || undefined,
      categoryIds: this.selectedCategoryIds.length ? this.selectedCategoryIds : undefined,
      provinceCodes: this.selectedProvinceCodes.length ? this.selectedProvinceCodes : undefined,
      wardCodes: this.selectedWardCodes.length ? this.selectedWardCodes : undefined,
      experienceFilter:
        this.selectedExperienceLevel !== null && this.selectedExperienceLevel !== undefined
          ? Number(this.selectedExperienceLevel)
          : undefined,
      minSalary: this.getMinSalary(),
      maxSalary: this.getMaxSalary(),
      salaryDeal: this.selectedSalaryFilter === 7 ? true : undefined,
      employmentTypes: this.selectedEmploymentTypes.length
        ? this.selectedEmploymentTypes
        : undefined,
      positionTypes: this.selectedPositionTypes.length ? this.selectedPositionTypes : undefined,
      skipCount: (this.currentPage - 1) * this.pageSize,
      maxResultCount: this.pageSize,
    };

    this.jobSearchService.searchJobs(input).subscribe({
      next: (response: any) => {
        // Backend trả mảng luôn → response chính là items
        this.jobs = Array.isArray(response) ? response : response.items ?? [];

        // Lọc client-side theo kinh nghiệm nếu đã chọn
        if (this.selectedExperienceLevel !== null && this.selectedExperienceLevel !== undefined) {
          const exp = Number(this.selectedExperienceLevel);
          this.jobs = this.jobs.filter(j => this.normalizeExperience(j.experience) === exp);
        }

        this.totalCount = this.jobs.length; // hoặc response.totalCount nếu có
        this.isSearching = false;
      },
      error: err => {
        this.jobs = [];
        this.totalCount = 0;
        this.isSearching = false;
      },
    });
  }

  // Convert salaryFilter (1-7) → min/max salary
  private getMinSalary(): number | undefined {
    if (!this.selectedSalaryFilter || this.selectedSalaryFilter === 7) return undefined;
    const map: Record<number, number> = {
      1: 0,
      2: 10_000_000,
      3: 15_000_000,
      4: 20_000_000,
      5: 30_000_000,
      6: 50_000_000,
    };
    return map[this.selectedSalaryFilter];
  }

  private getMaxSalary(): number | undefined {
    if (!this.selectedSalaryFilter || this.selectedSalaryFilter === 7) return undefined;
    const map: Record<number, number | undefined> = {
      1: 10_000_000,
      2: 15_000_000,
      3: 20_000_000,
      4: 30_000_000,
      5: 50_000_000,
      6: undefined,
    };
    return map[this.selectedSalaryFilter];
  }

  // =================== EVENT HANDLERS ===================
  onCategorySelected(ids: string[]) {
    this.selectedCategoryIds = ids;
    this.currentPage = 1;
    this.performJobSearch();
  }

  onLocationSelected(loc: { provinceIds: number[]; districtIds: number[] }) {
    this.selectedProvinceCodes = loc.provinceIds;
    this.selectedWardCodes = loc.districtIds;
    this.currentPage = 1;
    this.performJobSearch();
  }

  onMainSearch(data: { keyword?: string }) {
    if (data.keyword !== undefined) this.searchKeyword = data.keyword;
    this.currentPage = 1;
    this.performJobSearch();
  }

  onFilterChange(filters: any) {
    this.selectedEmploymentTypes = filters.employmentTypes || [];
    this.selectedExperienceLevel = filters.experienceLevel ?? null;
    this.selectedSalaryFilter = filters.salaryFilter ?? null;
    this.selectedPositionTypes = filters.positionTypes || [];
    this.currentPage = 1;
    this.performJobSearch();
  }

  onClearFilters() {
    this.searchKeyword = '';
    this.selectedCategoryIds = [];
    this.selectedProvinceCodes = [];
    this.selectedWardCodes = [];
    this.selectedEmploymentTypes = [];
    this.selectedExperienceLevel = null;
    this.selectedSalaryFilter = null;
    this.selectedPositionTypes = [];
    this.currentPage = 1;
    this.performJobSearch();
  }

  // Quick view / Detail
  onQuickView(job: JobViewDto) {
    // Load chi tiết job từ BE
    if (job.id) {
      this.jobSearchService.getJobById(job.id).subscribe({
        next: (jobDetail: any) => {
          this.selectedJob = jobDetail;
        },
        error: (err) => {
          // Fallback: dùng job cơ bản nếu không load được detail
          this.selectedJob = job;
        }
      });
    } else {
      this.selectedJob = job;
    }
  }

  onCloseDetail() {
    this.selectedJob = null;
  }

  onViewDetail(job: JobViewDto) {
    this.router.navigate(['/job-detail', job.id]);
  }

  onJobClick(job: JobViewDto) {
    this.router.navigate(['/job-detail', job.id]);
  }

  onJobHidden() {
    this.selectedJob = null;
  }

  // Apply actions
  onApply(job: JobViewDto) {
    if (!job || !job.id) return;
    this.applyJobId = job.id.toString();
    this.applyJobTitle = job.title || '';
    this.showApplyModal = true;
  }

  onCloseApplyModal() {
    this.showApplyModal = false;
  }

  onSubmitApply(result: { success: boolean; message: string }) {
    this.showApplyModal = false;
    this.toastMessage = result?.message || (result?.success ? 'Ứng tuyển thành công' : 'Ứng tuyển thất bại');
    this.toastType = result?.success ? 'success' : 'error';
    this.showToast = true;
  }

  onToastClose() {
    this.showToast = false;
  }

  // Normalize experience value (number | string) to enum number for filtering
  private normalizeExperience(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;
    const mapNum: Record<number, number> = {
      0: 0, // None
      1: 1, // Under1 (có nơi lưu 1)
      2: 2, // 1 năm
      3: 3, // 2 năm
      4: 4, // 3 năm
      5: 5, // 4 năm
      6: 6, // 5 năm
      7: 7, // 6 năm
      8: 8, // 7 năm
      9: 9, // 8 năm
      10: 10, // 9 năm
      11: 11, // 10 năm
      12: 12, // Trên 10 năm
    };
    const num = Number(value);
    if (!isNaN(num) && mapNum[num] !== undefined) return mapNum[num];

    const lower = String(value).toLowerCase();
    if (lower.includes('under1') || lower.includes('dưới') || lower.includes('duoi')) return 1;
    if (lower.includes('không yêu') || lower.includes('khong yeu') || lower.includes('none')) return 0;
    if (lower.includes('1 năm') || lower.includes('1 nam') || lower.includes('year1') || lower === '1') return 2;
    if (lower.includes('2 năm') || lower.includes('2 nam') || lower.includes('year2') || lower === '2') return 3;
    if (lower.includes('3 năm') || lower.includes('3 nam') || lower.includes('year3') || lower === '3') return 4;
    if (lower.includes('4 năm') || lower.includes('4 nam') || lower.includes('year4') || lower === '4') return 5;
    if (lower.includes('5 năm') || lower.includes('5 nam') || lower.includes('year5') || lower === '5') return 6;
    if (lower.includes('6 năm') || lower.includes('6 nam') || lower.includes('year6') || lower === '6') return 7;
    if (lower.includes('7 năm') || lower.includes('7 nam') || lower.includes('year7') || lower === '7') return 8;
    if (lower.includes('8 năm') || lower.includes('8 nam') || lower.includes('year8') || lower === '8') return 9;
    if (lower.includes('9 năm') || lower.includes('9 nam') || lower.includes('year9') || lower === '9') return 10;
    if (lower.includes('10 năm') || lower.includes('10 nam') || lower.includes('year10') || lower === '10') return 11;
    if (lower.includes('trên 10') || lower.includes('tren 10') || lower.includes('over10')) return 12;
    return undefined;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
