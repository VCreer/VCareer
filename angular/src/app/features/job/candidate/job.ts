import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { JobFilterComponent } from '../../../shared/components/job-filter/job-filter';
import { JobListComponent } from '../../../shared/components/job-list/job-list';
import { JobListDetailComponent } from '../../../shared/components/job-list-detail/job-list-detail';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar';
// ✅ Import API Services & DTOs
import { CategoryApiService, CategoryTreeDto } from '../../../apiTest/api/category.service';
import { LocationApiService, ProvinceDto } from '../../../apiTest/api/location.service';
import {
  JobApiService,
  JobSearchInputDto,
  JobViewDto,
  PagedResultDto,
  EmploymentType,
  ExperienceLevel,
  PositionType,
  SalaryFilterType,
} from '../../../apiTest/api/job.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-job',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JobFilterComponent,
    JobListComponent,
    JobListDetailComponent,
    FilterBarComponent, // ✅ Replace SearchHeaderComponent with FilterBarComponent
  ],
  templateUrl: './job.html',
  styleUrls: ['./job.scss'],
})
export class JobComponent implements OnInit {
  @ViewChild(JobListComponent) jobListComponent!: JobListComponent;
  @ViewChild(JobFilterComponent) jobFilterComponent!: JobFilterComponent;

  selectedLanguage: string = 'vi';

  // ============================================
  // ✅ API DATA
  // ============================================
  categories: CategoryTreeDto[] = [];
  provinces: ProvinceDto[] = [];
  isLoadingData = false;

  // ============================================
  // ✅ SEARCH FILTERS (From Home or local)
  // ============================================
  searchKeyword: string = '';
  selectedCategoryIds: string[] = [];
  selectedProvinceIds: number[] = [];
  selectedDistrictIds: number[] = [];

  // Left-side Filters
  selectedEmploymentTypes: EmploymentType[] = [];
  selectedExperienceLevel: ExperienceLevel | null = null;
  selectedSalaryFilter: SalaryFilterType | null = null;
  selectedPositionTypes: PositionType[] = [];

  // ============================================
  // ✅ JOB RESULTS
  // ============================================
  jobs: JobViewDto[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  isSearching = false;

  selectedJob: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translationService: TranslationService,
    private categoryApi: CategoryApiService,
    private locationApi: LocationApiService,
    private jobApi: JobApiService
  ) {}

  ngOnInit() {
    console.log('\n\n');
    console.log('🚀 ===== JOB COMPONENT INITIALIZED =====');
    console.log('⏰ Timestamp:', new Date().toISOString());

    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // ✅ Load initial data (categories, provinces)
    this.loadInitialData();

    // ✅ Read query params from URL (filters từ Home page)
    this.route.queryParams.subscribe(params => {
      console.log('\n📥 ===== QUERY PARAMS RECEIVED =====');
      console.log('Full params object:', params);
      console.log('Has params?', Object.keys(params).length > 0);

      // Restore filters from query params
      if (params['keyword']) {
        this.searchKeyword = params['keyword'];
      }

      if (params['categoryIds']) {
        this.selectedCategoryIds = params['categoryIds'].split(',');
      }

      if (params['provinceIds']) {
        this.selectedProvinceIds = params['provinceIds']
          .split(',')
          .map((id: string) => parseInt(id));
      }

      if (params['districtIds']) {
        this.selectedDistrictIds = params['districtIds']
          .split(',')
          .map((id: string) => parseInt(id));
      }

      console.log('✅ Restored filters:', {
        keyword: this.searchKeyword,
        categoryIds: this.selectedCategoryIds,
        provinceIds: this.selectedProvinceIds,
        districtIds: this.selectedDistrictIds,
      });

      // ✅ Perform search with restored filters
      this.performJobSearch();
    });
  }

  /**
   * ✅ Load categories & provinces từ API
   */
  loadInitialData() {
    this.isLoadingData = true;

    forkJoin({
      categories: this.categoryApi.getCategoryTree(),
      provinces: this.locationApi.getAllProvinces(),
    }).subscribe({
      next: data => {
        this.categories = data.categories;
        this.provinces = data.provinces;
        this.isLoadingData = false;
        console.log('✅ Loaded initial data:', {
          categoriesCount: this.categories.length,
          provincesCount: this.provinces.length,
        });
      },
      error: error => {
        console.error('❌ Error loading initial data:', error);
        this.isLoadingData = false;
      },
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  // ============================================
  // ✅ JOB SEARCH API LOGIC
  // ============================================

  /**
   * Perform job search với filters hiện tại
   */
  performJobSearch() {
    console.log('\n\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 PERFORMING JOB SEARCH - START');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🎯 Function called from:', new Error().stack);

    console.log('\n📋 CURRENT FILTERS:');
    console.log('   🔤 Keyword:', this.searchKeyword || '(none)');
    console.log('   📂 Category IDs:', this.selectedCategoryIds);
    console.log('   📍 Province IDs:', this.selectedProvinceIds);
    console.log('   🏘️  District IDs:', this.selectedDistrictIds);
    console.log('   💼 Employment Types:', this.selectedEmploymentTypes);
    console.log('   📊 Experience Level:', this.selectedExperienceLevel);
    console.log('   💰 Salary Filter:', this.selectedSalaryFilter);
    console.log('   🎯 Position Types:', this.selectedPositionTypes);
    console.log('   📄 Page:', this.currentPage, '| Page Size:', this.pageSize);

    const searchInput: JobSearchInputDto = {
      keyword: this.searchKeyword || null,
      categoryIds: this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : null,
      provinceIds: this.selectedProvinceIds.length > 0 ? this.selectedProvinceIds : null,
      districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : null,
      // ✅ FIX: Use nullish coalescing (??) instead of logical OR (||)
      experienceFilter: this.selectedExperienceLevel ?? null,
      salaryFilter: this.selectedSalaryFilter ?? null,
      employmentTypes:
        this.selectedEmploymentTypes.length > 0 ? this.selectedEmploymentTypes : null,
      positionTypes: this.selectedPositionTypes.length > 0 ? this.selectedPositionTypes : null,
      isUrgent: false, // ✅ false = lấy tất cả (không filter theo urgent)
      sortBy: 'relevance',
      skipCount: (this.currentPage - 1) * this.pageSize,
      maxResultCount: this.pageSize,
    };

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 REQUEST PAYLOAD - DETAIL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 FULL DTO (JobSearchInputDto):');
    console.log('   ┌─ keyword:', searchInput.keyword);
    console.log('   ├─ categoryIds:', searchInput.categoryIds);
    console.log('   ├─ provinceIds:', searchInput.provinceIds);
    console.log('   ├─ districtIds:', searchInput.districtIds);
    console.log('   ├─ experienceFilter:', searchInput.experienceFilter);
    console.log('   ├─ salaryFilter:', searchInput.salaryFilter);
    console.log('   ├─ employmentTypes:', searchInput.employmentTypes);
    console.log('   ├─ positionTypes:', searchInput.positionTypes);
    console.log('   ├─ isUrgent:', searchInput.isUrgent);
    console.log('   ├─ sortBy:', searchInput.sortBy);
    console.log('   ├─ skipCount:', searchInput.skipCount);
    console.log('   └─ maxResultCount:', searchInput.maxResultCount);

    console.log('\n📋 JSON STRINGIFY:');
    console.log(JSON.stringify(searchInput, null, 2));

    console.log('\n🌐 API ENDPOINT: POST /api/jobs/search');
    console.log('🔗 Full URL:', `${this.getApiUrl()}/api/jobs/search`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    this.isSearching = true;

    try {
      this.jobApi.searchJobs(searchInput).subscribe({
        next: (result: PagedResultDto<JobViewDto>) => {
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ SEARCH SUCCESS - RESPONSE RECEIVED');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('\n📥 RESPONSE DATA:');
          console.log('   📊 Total Count:', result.totalCount);
          console.log('   📦 Items Returned:', result.items?.length || 0);

          if (result.items && result.items.length > 0) {
            console.log('\n📄 JOB ITEMS:');
            result.items.forEach((job, index) => {
              console.log(`   ${index + 1}. ${job.title} - ${job.salaryText}`);
              console.log(`      Category: ${job.categoryName || 'N/A'}`);
              console.log(`      Location: ${job.provinceName || 'N/A'}`);
              console.log(`      Experience: ${job.experienceText}`);
              console.log(`      Posted: ${job.postedAt}`);
              console.log(`      Urgent: ${job.isUrgent ? '🔥 YES' : 'No'}`);
            });
          } else {
            console.log('\n📄 NO JOB ITEMS FOUND');
          }

          this.jobs = result.items || [];
          this.totalCount = result.totalCount || 0;
          this.isSearching = false;

          console.log('\n✅ UI Updated with results!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
        },
        error: error => {
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ SEARCH ERROR - FAILED');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('\n🔴 ERROR DETAILS:');
          console.error('   Status:', error.status);
          console.error('   Status Text:', error.statusText);
          console.error('   Message:', error.message);
          console.error('   URL:', error.url);

          if (error.error) {
            console.error('\n📦 Backend Error Response:');
            console.error(error.error);
          }

          console.error('\n📦 Full Error Object:');
          console.error(error);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

          this.isSearching = false;
          this.jobs = [];
          this.totalCount = 0;
        },
      });
    } catch (error) {
      console.error('❌ EXCEPTION in performJobSearch():');
      console.error(error);
      this.isSearching = false;
    }
  }

  /**
   * Helper: Get API base URL (for logging)
   */
  private getApiUrl(): string {
    // JobApiService tự động dùng environment.apis.default.url
    // Đây chỉ để log thôi
    return 'https://localhost:44385'; // From environment
  }

  // ============================================
  // ✅ EVENT HANDLERS: FilterBar (Category/Location)
  // ============================================

  /**
   * Event: User chọn categories từ FilterBar
   */
  onCategorySelected(categoryIds: string[]) {
    console.log('✅ Categories selected:', categoryIds);
    this.selectedCategoryIds = categoryIds;
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
  }

  /**
   * Event: User chọn locations từ FilterBar
   */
  onLocationSelected(location: { provinceIds: number[]; districtIds: number[] }) {
    console.log('✅ Locations selected:', location);
    this.selectedProvinceIds = location.provinceIds;
    this.selectedDistrictIds = location.districtIds;
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
  }

  /**
   * Event: User nhập keyword từ search input
   */
  onSearchKeywordChange(keyword: string) {
    this.searchKeyword = keyword;
    // Không tự động search, đợi user click nút "Tìm kiếm"
  }

  /**
   * Event: User click nút "Tìm kiếm"
   */
  onMainSearch(data: any) {
    console.log('🔍 Main search triggered:', data);
    if (data && data.keyword !== undefined) {
      this.searchKeyword = data.keyword;
    }
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
  }

  // ============================================
  // ✅ EVENT HANDLERS: Left-side Filters
  // ============================================

  /**
   * Event: Filter change từ JobFilterComponent (bên trái)
   */
  onFilterChange(filters: any) {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│ 🔧 LEFT-SIDE FILTER CHANGED           │');
    console.log('└─────────────────────────────────────────┘');
    console.log('📦 Received filters:', filters);
    console.log('   💼 Employment Types:', filters.employmentTypes);
    console.log(
      '   📊 Experience Level:',
      filters.experienceLevel,
      this.getExperienceLevelLabel(filters.experienceLevel)
    );
    console.log(
      '   💰 Salary Filter:',
      filters.salaryFilter,
      this.getSalaryFilterLabel(filters.salaryFilter)
    );
    console.log('   🎯 Position Types:', filters.positionTypes);

    // Update filters
    this.selectedEmploymentTypes = filters.employmentTypes || [];
    // ✅ FIX: Use nullish coalescing (??) instead of logical OR (||)
    // || treats 0 as falsy, ?? only treats null/undefined as falsy
    this.selectedExperienceLevel = filters.experienceLevel ?? null;
    this.selectedSalaryFilter = filters.salaryFilter ?? null;
    this.selectedPositionTypes = filters.positionTypes || [];

    this.currentPage = 1; // Reset to page 1

    console.log('✅ Filters updated! Triggering search...\n');
    this.performJobSearch();
  }

  /**
   * Helper: Get experience level label
   */
  private getExperienceLevelLabel(value: number | null): string {
    const labels: any = {
      0: '(Không yêu cầu)',
      1: '(Dưới 1 năm)',
      2: '(1 năm)',
      3: '(2 năm)',
      4: '(3 năm)',
      5: '(4 năm)',
      6: '(5 năm)',
      7: '(6 năm)',
      8: '(7 năm)',
      9: '(8 năm)',
      10: '(9 năm)',
      11: '(10 năm)',
      12: '(Trên 10 năm)',
    };
    return value !== null ? labels[value] || '' : '(Tất cả)';
  }

  /**
   * Helper: Get salary filter label
   */
  private getSalaryFilterLabel(value: number | null): string {
    const labels: any = {
      1: '(Dưới 10 triệu)',
      2: '(10-15 triệu)',
      3: '(15-20 triệu)',
      4: '(20-30 triệu)',
      5: '(30-50 triệu)',
      6: '(Trên 50 triệu)',
      7: '(Thỏa thuận)',
    };
    return value !== null ? labels[value] || '' : '(Tất cả)';
  }

  /**
   * Clear all filters
   */
  onClearFilters() {
    console.log('🧹 Clearing all filters');

    // Clear all filters
    this.searchKeyword = '';
    this.selectedCategoryIds = [];
    this.selectedProvinceIds = [];
    this.selectedDistrictIds = [];
    this.selectedEmploymentTypes = [];
    this.selectedExperienceLevel = null;
    this.selectedSalaryFilter = null;
    this.selectedPositionTypes = [];

    this.currentPage = 1;
    this.performJobSearch();
  }

  onQuickView(job: any) {
    this.selectedJob = job;
  }

  onCloseDetail() {
    this.selectedJob = null;
  }

  onViewDetail(job: any) {
    console.log('View detail:', job);
    // Navigate to full job detail page
    this.router.navigate(['/candidate/job-detail', job.id]);
  }

  onApply(job: any) {
    console.log('Apply to job:', job);
    // Handle apply logic
  }

  onJobClick(job: any) {
    // Navigate to job detail page when clicking on job card
    this.router.navigate(['/candidate/job-detail', job.id]);
  }

  onJobHidden() {
    this.selectedJob = null;
  }
}
