import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
// Import shared components
import { HeroSectionComponent } from '../../../../shared/components/hero-section/hero-section';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar';
import { JobListingsComponent } from '../../../../shared/components/job-listings/job-listings';
import { CategorySectionComponent } from '../../../../shared/components/category-section/category-section';
import { AboutUsComponent } from '../../../../shared/components/about-us/about-us';
import { StatisticsComponent } from '../../../../shared/components/statistics/statistics';
import { FutureHeroComponent } from '../../../../shared/components/future-hero/future-hero';
// API imports
import { JobSearchInputDto, JobViewDto } from '../../../../proxy/dto/job-dto';
import { JobPostService, JobSearchService } from 'src/app/proxy/services/job';
import { GeoService } from 'src/app/core/services/Geo.service';
import { ProvinceDto } from 'src/app/proxy/dto/geo-dto';
import { CategoryTreeDto } from 'src/app/proxy/dto/category';
import { JobCategoryService } from 'src/app/proxy/job';

@Component({
  selector: 'app-candidate-homepage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeroSectionComponent,
    FilterBarComponent,
    JobListingsComponent,
    CategorySectionComponent,
    AboutUsComponent,
    StatisticsComponent,
    FutureHeroComponent,
  ],
  templateUrl: './candidate-homepage.html',
  styleUrls: ['./candidate-homepage.scss']
})
export class CandidateHomepageComponent implements OnInit {
  // Statistics data for component
  statisticsData = [
    {
      number: '12k+',
      title: 'stats.customers_title',
      description: 'stats.customers_desc',
    },
    {
      number: '20k+',
      title: 'stats.resumes_title',
      description: 'stats.resumes_desc',
    },
    {
      number: '18k+',
      title: 'stats.companies_title',
      description: 'stats.companies_desc',
    },
  ];

  // API Data
  categories: CategoryTreeDto[] = [];
  provinces: ProvinceDto[] = [];
  isLoadingData = false;
  isLoadingJobs = false;

  // Selected filters (from FilterBar)
  selectedCategoryIds: string[] = [];
  selectedProvinceCode: number[] = [];
  selectedWardCode: number[] = [];
  searchKeyword: string = '';

  // Pagination for jobs
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 12;
  skipCount = 0;

  // Category Navigation (for CategorySection with images)
  currentCategoryPage = 1;
  totalCategoryPages = 1;
  categoriesPerPage = 8;

  // Job listings from API
  jobListings: JobViewDto[] = [];

  // Mock data cho CategorySection với hình ảnh (categories với images để hiển thị)
  mockCategoriesForSection = [
    {
      id: 1,
      name: 'Kinh doanh - Bán hàng',
      jobCount: 10016,
      image: 'assets/images/home/Browse-by-category/kinh-doanh-ban-hang.png',
    },
    {
      id: 2,
      name: 'Marketing - PR - Quảng cáo',
      jobCount: 7157,
      image: 'assets/images/home/Browse-by-category/marketing-truyen-thong-quang-cao.png',
    },
    {
      id: 3,
      name: 'Chăm sóc khách hàng',
      jobCount: 2450,
      image: 'assets/images/home/Browse-by-category/dich-vu-khach-hang.png',
    },
    {
      id: 4,
      name: 'Nhân sự - Hành chính',
      jobCount: 2908,
      image: 'assets/images/home/Browse-by-category/hanh-chinh-van-phong.png',
    },
    {
      id: 5,
      name: 'Công nghệ Thông tin',
      jobCount: 2171,
      image: 'assets/images/home/Browse-by-category/cong-nghe-thong-tin.png',
    },
    {
      id: 6,
      name: 'Tài chính - Ngân hàng',
      jobCount: 1583,
      image: 'assets/images/home/Browse-by-category/ngan-hang-tai-chinh.png',
    },
    {
      id: 7,
      name: 'Bất động sản',
      jobCount: 359,
      image: 'assets/images/home/Browse-by-category/bat-dong-san.png',
    },
    {
      id: 8,
      name: 'Kế toán - Kiểm toán',
      jobCount: 5288,
      image: 'assets/images/home/Browse-by-category/ke-toan-kiem-toan.png',
    },
  ];

  constructor(
    private router: Router,
    private categoryService: JobCategoryService,
    private geoService: GeoService,
    private jobSearchService: JobSearchService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.updateCategoryPagination();
  }

  /**
   * ✅ Load Categories, Provinces và Jobs từ API khi init
   */
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
        
        console.log('✅ Loaded categories:', this.categories.length);
        console.log('✅ Loaded provinces:', this.provinces.length);

        // Load jobs sau khi có categories và provinces
        this.loadJobs();
      },
      error: error => {
        console.error('❌ Error loading initial data:', error);
        this.isLoadingData = false;
        alert('Không thể tải dữ liệu. Vui lòng kiểm tra backend API!');
      },
    });
  }

  /**
   * ✅ Load jobs từ API với filters hiện tại
   */
  loadJobs() {
    this.isLoadingJobs = true;

    const searchInput: JobSearchInputDto = {
      keyword: this.searchKeyword || undefined,
      categoryIds: this.selectedCategoryIds,
      provinceCodes: this.selectedProvinceCode,
      wardCodes: this.selectedWardCode,
      skipCount: this.skipCount,
      maxResultCount: this.itemsPerPage,
    };

    console.log('🔍 Loading jobs with filters:', searchInput);

    this.jobSearchService.searchJobs(searchInput).subscribe({
      next: (jobs) => {
        this.jobListings = jobs;
        this.isLoadingJobs = false;
        
        // Update pagination (giả sử có thêm totalCount từ API)
        // Nếu API không trả về totalCount, có thể cần thêm API riêng để lấy
        this.totalPages = Math.ceil(jobs.length / this.itemsPerPage);
        
        console.log('✅ Loaded jobs:', jobs.length);
      },
      error: (error) => {
        console.error('❌ Error loading jobs:', error);
        this.isLoadingJobs = false;
        this.jobListings = [];
      },
    });
  }

  /**
   * Event handler: Khi user nhấn nút Search
   */
  onSearch(searchData: any) {
    console.log('🔍 Search triggered with data:', searchData);

    if (searchData && searchData.keyword) {
      this.searchKeyword = searchData.keyword;
    }

    this.performJobSearch();
  }

  /**
   * ✅ Navigate đến trang Job Search với filters
   */
  performJobSearch() {
    console.log('\n🚀 ===== NAVIGATING TO JOB SEARCH PAGE =====');
    console.log('   - Keyword:', this.searchKeyword);
    console.log('   - Category IDs:', this.selectedCategoryIds);
    console.log('   - Province Codes:', this.selectedProvinceCode);
    console.log('   - Ward Codes:', this.selectedWardCode);

    const queryParams: any = {};

    if (this.searchKeyword) {
      queryParams.keyword = this.searchKeyword;
    }

    if (this.selectedCategoryIds.length > 0) {
      queryParams.categoryIds = this.selectedCategoryIds.join(',');
    }

    if (this.selectedProvinceCode.length > 0) {
      queryParams.provinceIds = this.selectedProvinceCode.join(',');
    }

    if (this.selectedWardCode.length > 0) {
      queryParams.districtIds = this.selectedWardCode.join(',');
    }

    console.log('📤 Query Params:', queryParams);

    this.router.navigate(['/candidate/job'], { queryParams });
  }

  /**
   * Event handler: Khi user chọn categories
   */
  onCategorySelected(categoryIds: string[]) {
    this.selectedCategoryIds = categoryIds;
    console.log('✅ Categories selected:', categoryIds);

    if (categoryIds.length > 0) {
      this.performJobSearch();
    }
  }

  /**
   * Event handler: Khi user chọn locations
   */
  onLocationSelected(location: { provinceCodes: number[]; wardCodes: number[] }) {
    this.selectedProvinceCode = location.provinceCodes;
    this.selectedWardCode = location.wardCodes;
    console.log('✅ Locations selected:');
    console.log('   - Province Codes:', location.provinceCodes);
    console.log('   - Ward Codes:', location.wardCodes);

    const totalLocationCount = location.provinceCodes.length + location.wardCodes.length;
    if (totalLocationCount > 0) {
      this.performJobSearch();
    }
  }

  /**
   * Pagination handlers
   */
  onPageChange(page: number) {
    this.currentPage = page;
    this.skipCount = (page - 1) * this.itemsPerPage;
    this.loadJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  /**
   * Job click handler
   */
  onJobClick(jobId: number) {
    console.log('Job clicked:', jobId);
    this.router.navigate(['/candidate/job', jobId]);
  }

  //#region Category Section với images
  previousCategoryPage() {
    if (this.currentCategoryPage > 1) {
      this.currentCategoryPage--;
    }
  }

  nextCategoryPage() {
    if (this.currentCategoryPage < this.totalCategoryPages) {
      this.currentCategoryPage++;
    }
  }

  updateCategoryPagination() {
    this.totalCategoryPages = Math.ceil(
      this.mockCategoriesForSection.length / this.categoriesPerPage
    );
  }

  getCurrentPageCategories() {
    const startIndex = (this.currentCategoryPage - 1) * this.categoriesPerPage;
    const endIndex = startIndex + this.categoriesPerPage;
    return this.mockCategoriesForSection.slice(startIndex, endIndex);
  }

  onCategoryPageChange(page: number) {
    this.currentCategoryPage = page;
  }

  onCategoryClick(categoryId: number) {
    console.log('Category clicked:', categoryId);
    // Navigate to category jobs với filter
    this.router.navigate(['/candidate/job'], {
      queryParams: { categoryIds: categoryId }
    });
  }
  //#endregion

  /**
   * Action buttons
   */
  searchJobs() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  learnMore() {
    this.router.navigate(['/about']);
  }

  viewAllJobs() {
    this.router.navigate(['/candidate/job']);
  }
}