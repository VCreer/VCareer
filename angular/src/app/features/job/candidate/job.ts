import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { JobFilterComponent } from '../../../shared/components/job-filter/job-filter';
import { JobListComponent } from '../../../shared/components/job-list/job-list';
import { JobListDetailComponent } from '../../../shared/components/job-list-detail/job-list-detail';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar';
// ✅ Import API Services & DTOs - Sử dụng từ proxy để match với geo API
import { CategoryTreeDto } from '../../../proxy/dto/category/models';
import { ProvinceDto } from '../../../proxy/dto/geo-dto/models';
import { JobCategoryService } from '../../../proxy/services/job/job-category.service';
import { GeoService } from '../../../core/services/Geo.service';
import { CategoryApiService } from '../../../apiTest/api/category.service';
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

  categories: CategoryTreeDto[] = [];
  provinces: ProvinceDto[] = [];
  isLoadingData = false;

  searchKeyword: string = '';
  selectedCategoryIds: string[] = [];
  selectedProvinceCodes: number[] = []; 
  selectedWardCodes: number[] = []; 

  // Left-side Filters
  selectedEmploymentTypes: EmploymentType[] = [];
  selectedExperienceLevel: ExperienceLevel | null = null;
  selectedSalaryFilter: SalaryFilterType | null = null;
  selectedPositionTypes: PositionType[] = [];

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
    private categoryService: JobCategoryService, 
    private geoService: GeoService, 
    private categoryApi: CategoryApiService, 
    private jobApi: JobApiService
  ) {}

  ngOnInit() {

    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    this.loadInitialData();

    //  Read query params from URL (filters từ Home page)
    this.route.queryParams.subscribe(params => {
      // Restore filters from query params
      if (params['keyword']) {
        this.searchKeyword = params['keyword'];
      }

      if (params['categoryIds']) {
        this.selectedCategoryIds = params['categoryIds'].split(',');
      }

      if (params['provinceIds']) {
        this.selectedProvinceCodes = params['provinceIds']
          .split(',')
          .map((id: string) => parseInt(id));
      }

      if (params['districtIds']) {
        this.selectedWardCodes = params['districtIds']
          .split(',')
          .map((id: string) => parseInt(id));
      }

      console.log('✅ Restored filters:', {
        keyword: this.searchKeyword,
        categoryIds: this.selectedCategoryIds,
        provinceCodes: this.selectedProvinceCodes,
        wardCodes: this.selectedWardCodes,
      });

      this.performJobSearch();
    });
  }

  
   //  Load categories & provinces từ API (sử dụng proxy services)
  loadInitialData() {
    this.isLoadingData = true;

    forkJoin({
      categories: this.categoryService.getCategoryTree(),
      provinces: this.geoService.getProvinces(),
    }).subscribe({
      next: data => {
        this.categories = data.categories;
        this.provinces = data.provinces;
        this.isLoadingData = false;
        console.log('Loaded initial data:', {
          categoriesCount: this.categories.length,
          provincesCount: this.provinces.length,
        });
      },
      error: error => {
        console.error(' Error loading initial data:', error);
        this.isLoadingData = false;
      },
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }


  performJobSearch() {
   

    const searchInput: JobSearchInputDto = {
      keyword: this.searchKeyword || null,
      categoryIds: this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : null,
  
      provinceIds: this.selectedProvinceCodes.length > 0 ? this.selectedProvinceCodes : null,
      districtIds: this.selectedWardCodes.length > 0 ? this.selectedWardCodes : null, 
      experienceFilter: this.selectedExperienceLevel ?? null,
      salaryFilter: this.selectedSalaryFilter ?? null,
      employmentTypes:
        this.selectedEmploymentTypes.length > 0 ? this.selectedEmploymentTypes : null,
      positionTypes: this.selectedPositionTypes.length > 0 ? this.selectedPositionTypes : null,
      isUrgent: false, 
      sortBy: 'relevance',
      skipCount: (this.currentPage - 1) * this.pageSize,
      maxResultCount: this.pageSize,
    };

    

    this.isSearching = true;

    try {
      this.jobApi.searchJobs(searchInput).subscribe({
        next: (result: PagedResultDto<JobViewDto>) => {

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
 
  onCategorySelected(categoryIds: string[]) {
    console.log('✅ Categories selected:', categoryIds);
    this.selectedCategoryIds = categoryIds;
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
  }

  onLocationSelected(location: { provinceIds: number[]; districtIds: number[] }) {
    console.log('✅ Locations selected:', location);
    this.selectedProvinceCodes = location.provinceIds;
    this.selectedWardCodes = location.districtIds;
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
  }

   // Event: User nhập keyword từ search input
  onSearchKeywordChange(keyword: string) {
    this.searchKeyword = keyword;
  }
// nhấn tìm kiếm
  onMainSearch(data: any) {
    console.log('🔍 Main search triggered:', data);
    if (data && data.keyword !== undefined) {
      this.searchKeyword = data.keyword;
    }
    this.currentPage = 1; // Reset to page 1
    this.performJobSearch();
  }

  
  // Event: Filter change từ JobFilterComponent (bên trái)
   
  onFilterChange(filters: any) {
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
    this.selectedProvinceCodes = [];
    this.selectedWardCodes = [];
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