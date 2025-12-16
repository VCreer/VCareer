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
import { NavigationService } from '../../../../core/services/navigation.service';

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
    private jobSearchService: JobSearchService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    // Kiểm tra trạng thái đăng nhập hiện tại
    const isCurrentlyLoggedIn = this.navigationService.isLoggedIn();
    
    // Luôn load từ cache trước (nếu chưa đăng nhập)
    if (!isCurrentlyLoggedIn) {
      this.loadStatsFromCache();
    }
    
    // Sau đó load từ API (logic trong loadInitialData sẽ xử lý cache)
    this.loadInitialData();
    
    // Subscribe vào authentication state để reload stats khi thay đổi
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        // Khi đăng nhập, reload stats từ API
        this.loadInitialData();
      } else {
        // Khi đăng xuất, load stats từ cache nếu có
        this.loadStatsFromCache();
      }
    });
  }

  /**
   * Load stats và categories từ cache (localStorage) nếu có
   */
  loadStatsFromCache() {
    try {
      const cachedStats = localStorage.getItem('homepage_stats');
      if (cachedStats) {
        const stats = JSON.parse(cachedStats);
        // Kiểm tra xem cache có còn hợp lệ không (24 giờ)
        const cacheTime = stats.timestamp || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - cacheTime < oneDay) {
          this.totalJobCount = stats.totalJobCount || 0;
          this.totalCategoryCount = stats.totalCategoryCount || 0;
          this.totalProvinceCount = stats.totalProvinceCount || 0;
          
          // Load categories từ cache nếu có
          if (stats.categories && Array.isArray(stats.categories) && stats.categories.length > 0) {
            this.categories = stats.categories;
            // Map categories với images để hiển thị
            this.mapCategoriesToDisplayFormat();
          }
        } else {
          // Cache hết hạn, xóa cache
          localStorage.removeItem('homepage_stats');
        }
      }
    } catch (error) {
      // Ignore cache errors
    }
  }

  /**
   * Lưu stats và categories vào cache (localStorage)
   */
  saveStatsToCache() {
    try {
      const stats = {
        totalJobCount: this.totalJobCount,
        totalCategoryCount: this.totalCategoryCount,
        totalProvinceCount: this.totalProvinceCount,
        categories: this.categories, // Lưu categories để hiển thị khi chưa đăng nhập
        timestamp: Date.now()
      };
      localStorage.setItem('homepage_stats', JSON.stringify(stats));
    } catch (error) {
      // Ignore cache errors
    }
  }

  /**
   * ✅ Load Categories, Provinces và Jobs từ API khi init
   */
  loadInitialData() {
    this.isLoadingData = true;

    // Gọi API searchJobs để lấy jobs (có thể không yêu cầu auth)
    // Dùng để tính tổng số jobs nếu categories không có dữ liệu
    const searchJobsForCount$ = this.jobSearchService.searchJobs({
      categoryIds: [],
      provinceCodes: [],
      wardCodes: [],
      skipCount: 0,
      maxResultCount: 10000, // Lấy nhiều để đếm tổng số
    }).pipe(
      catchError(error => {
        // Nếu lỗi, trả về mảng rỗng
        return of([] as JobViewDto[]);
      })
    );

    forkJoin({
      categories: this.categoryService.getCategoryTree().pipe(
        catchError(error => {
          // Nếu lỗi 401, trả về mảng rỗng
          return of([] as CategoryTreeDto[]);
        })
      ),
      provinces: this.geoService.getProvinces().pipe(
        catchError(error => {
          return of([] as ProvinceDto[]);
        })
      ),
      jobs: searchJobsForCount$,
    }).subscribe({
      next: data => {
        const isLoggedIn = this.navigationService.isLoggedIn();
        
        // Lưu categories từ cache trước khi cập nhật (nếu chưa đăng nhập)
        const cachedCategories = !isLoggedIn && this.categories.length > 0 ? [...this.categories] : [];
        
        // Cập nhật categories và provinces từ API
        if (data.categories && data.categories.length > 0) {
          // Có categories từ API, cập nhật
          this.categories = data.categories;
        } else if (!isLoggedIn && cachedCategories.length > 0) {
          // Chưa đăng nhập và không có categories từ API, giữ nguyên từ cache
          // Không ghi đè categories từ cache
        } else {
          // Không có categories từ API và không có cache, set rỗng
          this.categories = [];
        }
        
        // Cập nhật provinces
        if (data.provinces && data.provinces.length > 0) {
          this.provinces = data.provinces;
        }
        
        this.isLoadingData = false;
        
        // Tính statistics
        // Ưu tiên dùng jobs từ searchJobs để tính totalJobCount (chính xác hơn)
        if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
          // Dùng số lượng jobs từ searchJobs làm totalJobCount
          this.totalJobCount = data.jobs.length;
          // Nếu lấy được 10000 jobs, có thể còn nhiều hơn
          if (data.jobs.length >= 10000) {
            this.totalJobCount = 10000;
          }
        } else if (this.categories.length > 0) {
          // Nếu không có jobs từ searchJobs, tính từ categories
          this.calculateStatistics();
        } else {
          // Không có cả jobs và categories, set về 0
          this.totalJobCount = 0;
        }
        
        // Tính totalCategoryCount và totalProvinceCount
        if (this.categories.length > 0) {
          // Đếm tổng số parent categories (root level) chỉ
          const rootCategories = this.categories.filter(cat => {
            return !cat.fullPath || !cat.fullPath.includes('/');
          });
          this.totalCategoryCount = rootCategories.length;
        } else {
          this.totalCategoryCount = 0;
        }
        
        if (this.provinces.length > 0) {
          this.totalProvinceCount = this.provinces.length;
        } else {
          this.totalProvinceCount = 0;
        }
        
        // Lưu stats vào cache CHỈ KHI đã đăng nhập và có dữ liệu hợp lệ
        if (isLoggedIn && (this.totalJobCount > 0 || this.totalCategoryCount > 0 || this.totalProvinceCount > 0)) {
          this.saveStatsToCache();
        }

        // Map categories với images (chỉ nếu có categories)
        if (this.categories.length > 0) {
          this.mapCategoriesToDisplayFormat();
        }

        // Load jobs sau khi có categories và provinces
        this.loadJobs();
      },
      error: error => {
        this.isLoadingData = false;
        // Nếu lỗi 401 (Unauthorized), vẫn dùng stats từ cache nếu có
        if (error?.status === 401) {
          // Stats đã được load từ cache trong ngOnInit
        }
        // Vẫn tính stats và load jobs dù có lỗi
        this.calculateStatistics();
        this.loadJobs();
      },
    });
  }

  /**
   * ✅ Calculate statistics từ API data
   * Luôn được gọi để đảm bảo stats được cập nhật
   * Logic nhất quán cho cả đăng nhập và chưa đăng nhập
   */
  calculateStatistics() {
    // Tính totalJobCount từ TẤT CẢ categories (parent + children)
    // Vì jobCount có thể nằm ở children thay vì parent
    if (this.categories && this.categories.length > 0) {
      const calculateJobCount = (cats: CategoryTreeDto[]): number => {
        let total = 0;
        cats.forEach(cat => {
          // Cộng jobCount của category hiện tại
          total += cat.jobCount || 0;
          // Nếu có children, tính đệ quy
          if (cat.children && cat.children.length > 0) {
            total += calculateJobCount(cat.children);
          }
        });
        return total;
      };
      
      this.totalJobCount = calculateJobCount(this.categories);
    } else {
      // Nếu không có categories, set về 0
      // (sẽ được cập nhật từ searchJobs nếu có trong loadInitialData)
      this.totalJobCount = 0;
    }
    
    // Đếm tổng số parent categories (root level) chỉ, không đếm children
    if (this.categories && this.categories.length > 0) {
      // Chỉ đếm parent categories (root level)
      const rootCategories = this.categories.filter(cat => {
        // Nếu không có fullPath hoặc fullPath không chứa '/', đó là root category
        return !cat.fullPath || !cat.fullPath.includes('/');
      });
      
      this.totalCategoryCount = rootCategories.length;
    } else {
      this.totalCategoryCount = 0;
    }
    
    // Tính totalProvinceCount
    if (this.provinces && this.provinces.length > 0) {
      this.totalProvinceCount = this.provinces.length;
    } else {
      this.totalProvinceCount = 0;
    }
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
    this.isLoadingJobs = true;

    const searchInput: JobSearchInputDto = {
      keyword: this.searchKeyword || undefined,
      categoryIds: this.selectedCategoryIds || [],
      provinceCodes: this.selectedProvinceCode || [],
      wardCodes: this.selectedWardCode || [],
      skipCount: this.skipCount,
      maxResultCount: this.itemsPerPage,
    };

    this.jobSearchService.searchJobs(searchInput).pipe(
      catchError(error => {
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
      },
      error: (error) => {
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
    if (searchData && searchData.keyword) {
      this.searchKeyword = searchData.keyword;
    }

    this.performJobSearch();
  }

  /**
   * ✅ Navigate đến trang Job Search với filters
   */
  performJobSearch() {
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

    this.router.navigate(['/job'], { queryParams });
  }

  /**
   * Event handler: Khi user chọn categories từ HeroSection hoặc JobListings
   */
  onCategorySelected(categoryIds: string[]) {
    this.selectedCategoryIds = categoryIds || [];

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
    const totalLocationCount = this.selectedProvinceCode.length + this.selectedWardCode.length;
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
   * ✅ Job click handler - FIXED: jobId phải là string
   */
  onJobClick(jobId: string) {
    // ✅ Navigate to job detail với string ID
     this.router.navigate(['/job-detail', jobId]);
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
    // Navigate to category jobs với filter
    this.router.navigate(['/job'], {
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
    this.router.navigate(['/job']);
  }
}