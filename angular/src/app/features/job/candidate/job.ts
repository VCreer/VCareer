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
import { CategoryApiService, CategoryTreeDto } from '../../../proxy/api/category.service';
import { LocationApiService, ProvinceDto } from '../../../proxy/api/location.service';
import { JobApiService, JobSearchInputDto, JobViewDto, PagedResultDto, EmploymentType, ExperienceLevel, PositionType, SalaryFilterType } from '../../../proxy/api/job.service';
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
    FilterBarComponent  // ✅ Replace SearchHeaderComponent with FilterBarComponent
  ],
  templateUrl: './job.html',
  styleUrls: ['./job.scss']
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
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // ✅ Load initial data (categories, provinces)
    this.loadInitialData();

    // ✅ Read query params from URL (filters từ Home page)
    this.route.queryParams.subscribe(params => {
      console.log('📥 Received query params:', params);
      
      // Restore filters from query params
      if (params['keyword']) {
        this.searchKeyword = params['keyword'];
      }
      
      if (params['categoryIds']) {
        this.selectedCategoryIds = params['categoryIds'].split(',');
      }
      
      if (params['provinceIds']) {
        this.selectedProvinceIds = params['provinceIds'].split(',').map((id: string) => parseInt(id));
      }
      
      if (params['districtIds']) {
        this.selectedDistrictIds = params['districtIds'].split(',').map((id: string) => parseInt(id));
      }

      console.log('✅ Restored filters:', {
        keyword: this.searchKeyword,
        categoryIds: this.selectedCategoryIds,
        provinceIds: this.selectedProvinceIds,
        districtIds: this.selectedDistrictIds
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
      provinces: this.locationApi.getAllProvinces()
    }).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.provinces = data.provinces;
        this.isLoadingData = false;
        console.log('✅ Loaded initial data:', {
          categoriesCount: this.categories.length,
          provincesCount: this.provinces.length
        });
      },
      error: (error) => {
        console.error('❌ Error loading initial data:', error);
        this.isLoadingData = false;
      }
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
    console.log('\n🔍 ===== PERFORMING JOB SEARCH =====');
    
    const searchInput: JobSearchInputDto = {
      keyword: this.searchKeyword || undefined,
      categoryIds: this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : undefined,
      provinceIds: this.selectedProvinceIds.length > 0 ? this.selectedProvinceIds : undefined,
      districtIds: this.selectedDistrictIds.length > 0 ? this.selectedDistrictIds : undefined,
      experienceFilter: this.selectedExperienceLevel || undefined,
      salaryFilter: this.selectedSalaryFilter || undefined,
      employmentTypes: this.selectedEmploymentTypes.length > 0 ? this.selectedEmploymentTypes : undefined,
      positionTypes: this.selectedPositionTypes.length > 0 ? this.selectedPositionTypes : undefined,
      sortBy: 'relevance',
      skipCount: (this.currentPage - 1) * this.pageSize,
      maxResultCount: this.pageSize
    };

    console.log('📤 Search Input:', JSON.stringify(searchInput, null, 2));

    this.isSearching = true;

    this.jobApi.searchJobs(searchInput).subscribe({
      next: (result: PagedResultDto<JobViewDto>) => {
        console.log('\n✅ ===== SEARCH SUCCESS =====');
        console.log('📥 Result:', result);
        
        this.jobs = result.items;
        this.totalCount = result.totalCount;
        this.isSearching = false;

        console.log(`   - Found ${result.totalCount} jobs`);
        console.log(`   - Displaying ${result.items.length} items`);
      },
      error: (error) => {
        console.error('\n❌ ===== SEARCH ERROR =====');
        console.error('Error:', error);
        this.isSearching = false;
        this.jobs = [];
        this.totalCount = 0;
      }
    });
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
  onLocationSelected(location: { provinceIds: number[], districtIds: number[] }) {
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
    console.log('🔧 Filters changed:', filters);
    
    // Update filters
    this.selectedEmploymentTypes = filters.employmentTypes || [];
    this.selectedExperienceLevel = filters.experienceLevel || null;
    this.selectedSalaryFilter = filters.salaryFilter || null;
    this.selectedPositionTypes = filters.positionTypes || [];
    
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
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
    this.router.navigate(['/candidate/job-detail']);
  }

  onApply(job: any) {
    console.log('Apply to job:', job);
    // Handle apply logic
  }

  onJobClick(job: any) {
    // Navigate to job detail page when clicking on job card
    this.router.navigate(['/candidate/job-detail']);
  }

  onJobHidden() {
    this.selectedJob = null;
  }
}
