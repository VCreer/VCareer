import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
import { JobSearchService } from 'src/app/proxy/services/job';
import { GeoService } from 'src/app/core/services/Geo.service';
import { ProvinceDto } from 'src/app/proxy/dto/geo-dto';
import { CategoryTreeDto } from 'src/app/proxy/dto/category';
import { JobCategoryService } from 'src/app/proxy/services/job';

// Interface cho category với image để hiển thị
interface CategoryWithImage {
  id: string;
  name: string;
  jobCount: number;
  image: string;
}

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

  // Statistics từ API (nếu HTML có binding)
  totalJobCount = 0;
  totalCategoryCount = 0;
  totalProvinceCount = 0;

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

  // Categories với images để hiển thị trong CategorySection
  categoriesWithImages: CategoryWithImage[] = [];

  // Mapping category name -> image path
  private categoryImageMap: { [key: string]: string } = {
    'kinh doanh': 'assets/images/home/Browse-by-category/kinh-doanh-ban-hang.png',
    'bán hàng': 'assets/images/home/Browse-by-category/kinh-doanh-ban-hang.png',
    'marketing': 'assets/images/home/Browse-by-category/marketing-truyen-thong-quang-cao.png',
    'quảng cáo': 'assets/images/home/Browse-by-category/marketing-truyen-thong-quang-cao.png',
    'chăm sóc khách hàng': 'assets/images/home/Browse-by-category/dich-vu-khach-hang.png',
    'dịch vụ khách hàng': 'assets/images/home/Browse-by-category/dich-vu-khach-hang.png',
    'nhân sự': 'assets/images/home/Browse-by-category/hanh-chinh-van-phong.png',
    'hành chính': 'assets/images/home/Browse-by-category/hanh-chinh-van-phong.png',
    'công nghệ thông tin': 'assets/images/home/Browse-by-category/cong-nghe-thong-tin.png',
    'it': 'assets/images/home/Browse-by-category/cong-nghe-thong-tin.png',
    'tài chính': 'assets/images/home/Browse-by-category/ngan-hang-tai-chinh.png',
    'ngân hàng': 'assets/images/home/Browse-by-category/ngan-hang-tai-chinh.png',
    'bất động sản': 'assets/images/home/Browse-by-category/bat-dong-san.png',
    'kế toán': 'assets/images/home/Browse-by-category/ke-toan-kiem-toan.png',
    'kiểm toán': 'assets/images/home/Browse-by-category/ke-toan-kiem-toan.png',
    'sản xuất': 'assets/images/home/Browse-by-category/san-xuat.png',
    'giáo dục': 'assets/images/home/Browse-by-category/giao-duc-dao-tao.png',
    'đào tạo': 'assets/images/home/Browse-by-category/giao-duc-dao-tao.png',
    'bán lẻ': 'assets/images/home/Browse-by-category/ban-le-ban-si.png',
    'dịch vụ': 'assets/images/home/Browse-by-category/ban-le-ban-si.png',
    'truyền hình': 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png',
    'báo chí': 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png',
    'điện': 'assets/images/home/Browse-by-category/dien-tu-vien-thong.png',
    'điện tử': 'assets/images/home/Browse-by-category/dien-tu-vien-thong.png',
    'viễn thông': 'assets/images/home/Browse-by-category/dien-tu-vien-thong.png',
    'logistics': 'assets/images/home/Browse-by-category/logistics.png',
    'kho vận': 'assets/images/home/Browse-by-category/logistics.png',
    'tư vấn': 'assets/images/home/Browse-by-category/tu-van.png',
    'dược': 'assets/images/home/Browse-by-category/y-te-duoc.png',
    'y tế': 'assets/images/home/Browse-by-category/y-te-duoc.png',
    'thiết kế': 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png',
    'nhà hàng': 'assets/images/home/Browse-by-category/khach-san-nha-hang.png',
    'khách sạn': 'assets/images/home/Browse-by-category/khach-san-nha-hang.png',
    'năng lượng': 'assets/images/home/Browse-by-category/nong-lam-ngu-nghiep.png',
    'môi trường': 'assets/images/home/Browse-by-category/nong-lam-ngu-nghiep.png',
  };

  // Default image for categories without mapping
  private defaultCategoryImage = 'assets/images/home/Browse-by-category/nganh-nghe-khac.png';

  constructor(
    private router: Router,
    private categoryService: JobCategoryService,
    private geoService: GeoService,
    private jobSearchService: JobSearchService
  ) {
    console.log('🏗️ CandidateHomepageComponent constructor called');
  }

  ngOnInit() {
    console.log('🚀 CandidateHomepageComponent ngOnInit called');
    this.loadInitialData();
  }

  /**
   * ✅ Load Categories, Provinces và Jobs từ API khi init
   */
  loadInitialData() {
    console.log('📥 Starting to load initial data...');
    this.isLoadingData = true;

    forkJoin({
      categories: this.categoryService.getCategoryTree().pipe(
        catchError(error => {
          console.error('❌ Error loading categories:', error);
          return of([] as CategoryTreeDto[]);
        })
      ),
      provinces: this.geoService.getProvinces().pipe(
        catchError(error => {
          console.error('❌ Error loading provinces:', error);
          return of([] as ProvinceDto[]);
        })
      ),
    }).subscribe({
      next: data => {
        this.categories = data.categories || [];
        this.provinces = data.provinces || [];
        this.isLoadingData = false;
        
        console.log('✅ Loaded categories:', this.categories.length, this.categories);
        console.log('✅ Loaded provinces:', this.provinces.length, this.provinces);

        // Calculate statistics nếu cần
        this.calculateStatistics();

        // Map categories với images
        this.mapCategoriesToDisplayFormat();

        // Load jobs sau khi có categories và provinces
        this.loadJobs();
      },
      error: error => {
        console.error('❌ Critical error loading initial data:', error);
        this.isLoadingData = false;
        
        // Vẫn load jobs dù có lỗi
        this.loadJobs();
      },
    });
  }

  /**
   * ✅ Calculate statistics từ API data (optional)
   */
  calculateStatistics() {
    if (this.categories && this.categories.length > 0) {
      this.totalJobCount = this.categories.reduce((sum, cat) => sum + (cat.jobCount || 0), 0);
      this.totalCategoryCount = this.categories.length;
    }
    
    if (this.provinces && this.provinces.length > 0) {
      this.totalProvinceCount = this.provinces.length;
    }

    console.log('📊 Statistics:', {
      totalJobCount: this.totalJobCount,
      totalCategoryCount: this.totalCategoryCount,
      totalProvinceCount: this.totalProvinceCount
    });
  }

  /**
   * ✅ Map CategoryTreeDto từ API sang format có image để hiển thị
   */
  mapCategoriesToDisplayFormat() {
    this.categoriesWithImages = [];

    // Lấy categories ở level root (parent categories)
    const rootCategories = this.categories.filter(cat => !cat.fullPath?.includes('/'));

    rootCategories.forEach(category => {
      const categoryWithImage: CategoryWithImage = {
        id: category.categoryId || '',
        name: category.categoryName || 'Chưa có tên',
        jobCount: category.jobCount || 0,
        image: this.getCategoryImage(category.categoryName || '')
      };

      this.categoriesWithImages.push(categoryWithImage);
    });

    // Sort by jobCount descending
    this.categoriesWithImages.sort((a, b) => b.jobCount - a.jobCount);

    // Update pagination
    this.updateCategoryPagination();

    console.log('✅ Mapped categories with images:', this.categoriesWithImages.length, this.categoriesWithImages);
  }

  /**
   * Get image path for category based on name matching
   */
  getCategoryImage(categoryName: string): string {
    const lowerName = categoryName.toLowerCase();
    
    // Try to find a matching keyword in the category name
    for (const [keyword, imagePath] of Object.entries(this.categoryImageMap)) {
      if (lowerName.includes(keyword)) {
        return imagePath;
      }
    }
    
    return this.defaultCategoryImage;
  }

  /**
   * ✅ Load jobs từ API với filters hiện tại
   */
  loadJobs() {
    console.log('📥 Starting to load jobs...');
    this.isLoadingJobs = true;

    const searchInput: JobSearchInputDto = {
      keyword: this.searchKeyword || undefined,
      categoryIds: this.selectedCategoryIds || [],
      provinceCodes: this.selectedProvinceCode || [],
      wardCodes: this.selectedWardCode || [],
      skipCount: this.skipCount,
      maxResultCount: this.itemsPerPage,
    };

    console.log('🔍 Loading jobs with filters:', searchInput);

    this.jobSearchService.searchJobs(searchInput).pipe(
      catchError(error => {
        console.error('❌ Error loading jobs:', error);
        return of([] as JobViewDto[]);
      })
    ).subscribe({
      next: (jobs) => {
        this.jobListings = jobs || [];
        this.isLoadingJobs = false;
        
        // Update pagination
        if (this.jobListings.length > 0) {
          this.totalPages = this.jobListings.length < this.itemsPerPage 
            ? this.currentPage 
            : this.currentPage + 1;
        } else {
          this.totalPages = 1;
        }
        
        console.log('✅ Loaded jobs:', this.jobListings.length, this.jobListings);
        console.log('📄 Current page:', this.currentPage, '/ Total pages:', this.totalPages);
      },
      error: (error) => {
        console.error('❌ Critical error loading jobs:', error);
        this.isLoadingJobs = false;
        this.jobListings = [];
        this.totalPages = 1;
      },
    });
  }

  /**
   * Event handler: Khi user nhấn nút Search từ HeroSection
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
   * Event handler: Khi user chọn categories từ HeroSection hoặc JobListings
   */
  onCategorySelected(categoryIds: string[]) {
    this.selectedCategoryIds = categoryIds || [];
    console.log('✅ Categories selected:', categoryIds);

    if (categoryIds && categoryIds.length > 0) {
      this.performJobSearch();
    }
  }

  /**
   * Event handler: Khi user chọn locations từ HeroSection hoặc JobListings
   */
  onLocationSelected(location: { provinceCodes: number[]; wardCodes: number[] }) {
    this.selectedProvinceCode = location?.provinceCodes || [];
    this.selectedWardCode = location?.wardCodes || [];
    
    console.log('✅ Locations selected:');
    console.log('   - Province Codes:', this.selectedProvinceCode);
    console.log('   - Ward Codes:', this.selectedWardCode);

    const totalLocationCount = this.selectedProvinceCode.length + this.selectedWardCode.length;
    if (totalLocationCount > 0) {
      this.performJobSearch();
    }
  }

  /**
   * Pagination handlers
   */
  onPageChange(page: number) {
    console.log('📄 Page changed to:', page);
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
   * ✅ Job click handler - FIXED: jobId phải là string
   */
  onJobClick(jobId: string) {
    console.log('💼 Job clicked:', jobId);
    // ✅ Navigate to job detail với string ID
     this.router.navigate(['/candidate/job-detail', jobId]);
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
      this.categoriesWithImages.length / this.categoriesPerPage
    );
  }

  /**
   * ✅ Get current page categories từ API data (đã map với images)
   */
  getCurrentPageCategories(): CategoryWithImage[] {
    const startIndex = (this.currentCategoryPage - 1) * this.categoriesPerPage;
    const endIndex = startIndex + this.categoriesPerPage;
    return this.categoriesWithImages.slice(startIndex, endIndex);
  }

  onCategoryPageChange(page: number) {
    this.currentCategoryPage = page;
  }

  /**
   * ✅ Handle category click - navigate với categoryId từ API
   */
  onCategoryClick(categoryId: string) {
    console.log('📁 Category clicked:', categoryId);
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
    console.log('🔍 Search jobs button clicked');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  learnMore() {
    console.log('📖 Learn more button clicked');
    this.router.navigate(['/about']);
  }

  viewAllJobs() {
    console.log('👀 View all jobs button clicked');
    this.router.navigate(['/candidate/job']);
  }
}