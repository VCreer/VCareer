import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

// Import API Services
//import { CategoryApiService, CategoryTreeDto } from '../../../../proxy/api/category.service';
import { CategoryApiService, CategoryTreeDto } from '../../../../apiTest/api/category.service';
import { LocationApiService, ProvinceDto } from '../../../../apiTest/api/location.service';
import {
  JobApiService,
  JobSearchInputDto,
  JobViewDto,
  PagedResultDto,
} from '../../../../apiTest/api/job.service';

// Import shared components
import { HeroSectionComponent } from '../../../../shared/components/hero-section/hero-section';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar';
import { JobListingsComponent } from '../../../../shared/components/job-listings/job-listings';
import { CategorySectionComponent } from '../../../../shared/components/category-section/category-section';
import { AboutUsComponent } from '../../../../shared/components/about-us/about-us';
import { StatisticsComponent } from '../../../../shared/components/statistics/statistics';
import { FutureHeroComponent } from '../../../../shared/components/future-hero/future-hero';

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
  styleUrls: ['./candidate-homepage.scss'],
})
export class CandidateHomepageComponent implements OnInit {
  // Dữ liệu form tìm kiếm
  searchForm = {
    jobTitle: '',
    location: '',
    category: '',
  };

  // Dữ liệu thống kê
  stats = {
    jobs: '25,850',
    candidates: '10,250',
    companies: '18,400',
  };

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

  // Selected filters (from FilterBar)
  selectedCategoryIds: string[] = [];
  selectedProvinceIds: number[] = [];
  selectedDistrictIds: number[] = [];
  searchKeyword: string = ''; // ✅ Keyword từ search input

  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 12;

  // Category Navigation
  currentCategoryPage = 1;
  totalCategoryPages = 1;
  categoriesPerPage = 8;

  // Dữ liệu danh sách việc làm hiển thị
  jobListings: any[] = [];

  // Mock data cho CategorySection (khác với categories từ API)
  mockCategoriesForSection = [
    // Trang 1: Categories chính
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
    // Trang 2: Categories bổ sung
    {
      id: 9,
      name: 'Sản xuất',
      jobCount: 3533,
      image: 'assets/images/home/Browse-by-category/san-xuat.png',
    },
    {
      id: 10,
      name: 'Giáo dục - Đào tạo',
      jobCount: 1973,
      image: 'assets/images/home/Browse-by-category/giao-duc-dao-tao.png',
    },
    {
      id: 11,
      name: 'Bán lẻ - Dịch vụ đời sống',
      jobCount: 796,
      image: 'assets/images/home/Browse-by-category/ban-le-ban-si.png',
    },
    {
      id: 12,
      name: 'Phim và truyền hình - Báo chí',
      jobCount: 273,
      image: 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png',
    },
    {
      id: 13,
      name: 'Điện - Điện tử - Viễn thông',
      jobCount: 1687,
      image: 'assets/images/home/Browse-by-category/dien-tu-vien-thong.png',
    },
    {
      id: 14,
      name: 'Logistics - Thu mua - Kho vận',
      jobCount: 2378,
      image: 'assets/images/home/Browse-by-category/logistics.png',
    },
    {
      id: 15,
      name: 'Tư vấn chuyên môn',
      jobCount: 124,
      image: 'assets/images/home/Browse-by-category/tu-van.png',
    },
    {
      id: 16,
      name: 'Dược - Y tế - Sức khỏe',
      jobCount: 848,
      image: 'assets/images/home/Browse-by-category/y-te-duoc.png',
    },
    // Trang 3: Categories khác
    {
      id: 17,
      name: 'Thiết kế',
      jobCount: 943,
      image: 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png',
    },
    {
      id: 18,
      name: 'Nhà hàng - Khách sạn',
      jobCount: 1125,
      image: 'assets/images/home/Browse-by-category/khach-san-nha-hang.png',
    },
    {
      id: 19,
      name: 'Năng lượng - Môi trường',
      jobCount: 359,
      image: 'assets/images/home/Browse-by-category/nong-lam-ngu-nghiep.png',
    },
    {
      id: 20,
      name: 'Nhóm nghề khác',
      jobCount: 502,
      image: 'assets/images/home/Browse-by-category/nganh-nghe-khac.png',
    },
  ];

  // Dữ liệu danh sách việc làm gốc
  originalJobListings = [
    {
      id: 1,
      timePosted: '10 phút trước',
      title: 'Forward Security Director',
      company: 'Bauch, Schuppe and Schulist Co',
      industry: 'Khách sạn & Du lịch',
      type: 'Toàn thời gian',
      salary: '40.000-42.000 đô la',
      location: 'New York, Hoa Kỳ',
      isBookmarked: false,
    },
    {
      id: 2,
      timePosted: '2 giờ trước',
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc',
      industry: 'Công nghệ thông tin',
      type: 'Toàn thời gian',
      salary: '50.000-60.000 đô la',
      location: 'San Francisco, Hoa Kỳ',
      isBookmarked: false,
    },
    {
      id: 3,
      timePosted: '5 giờ trước',
      title: 'Marketing Manager',
      company: 'Digital Marketing Co',
      industry: 'Marketing & Quảng cáo',
      type: 'Toàn thời gian',
      salary: '35.000-45.000 đô la',
      location: 'Los Angeles, Hoa Kỳ',
      isBookmarked: false,
    },
  ];

  constructor(
    private router: Router,
    private categoryApi: CategoryApiService,
    private locationApi: LocationApiService,
    private jobApi: JobApiService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.loadAllJobs(); // Khởi tạo danh sách việc làm
    this.updateCategoryPagination();
  }

  /**
   * Load Categories và Provinces từ API khi init
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
        console.log('✅ CandidateHomepage - Loaded categories:', this.categories.length);
        console.log('✅ CandidateHomepage - Loaded provinces:', this.provinces.length);
        console.log('Categories data:', this.categories);
        console.log('Provinces data:', this.provinces);
      },
      error: error => {
        console.error('❌ Error loading initial data:', error);
        console.error('Error details:', error.message);
        this.isLoadingData = false;
        // ✅ Show user-friendly message
        alert('Không thể tải dữ liệu. Vui lòng kiểm tra backend API có chạy không!');
      },
    });
  }

  toggleBookmark(jobId: number) {
    const job = this.jobListings.find(j => j.id === jobId);
    if (job) {
      job.isBookmarked = !job.isBookmarked;
    }
  }

  viewJobDetails(jobId: number) {
    // Điều hướng đến trang chi tiết việc làm
  }

  viewCategoryJobs(categoryId: number) {
    // Điều hướng đến trang danh sách việc làm theo danh mục
    console.log('Viewing jobs for category:', categoryId);
  }

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

  viewAllJobs() {
    // Điều hướng đến trang tất cả việc làm
  }

  searchJobs() {
    // Kéo lên trên trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  learnMore() {
    // Điều hướng đến trang về chúng tôi
    this.router.navigate(['/about']);
  }

  // ============================================
  // ✅ NEW: JOB SEARCH LOGIC
  // ============================================

  /**
   * Event handler: Khi user nhấn nút Search
   */
  onSearch(searchData: any) {
    console.log('🔍 Search triggered with data:', searchData);

    // Lưu keyword
    if (searchData && searchData.keyword) {
      this.searchKeyword = searchData.keyword;
    }

    // Thực hiện search
    this.performJobSearch();
  }

  /**
   * ✅ CORE: Navigate đến trang Job Search với filters
   */
  performJobSearch() {
    console.log('\n🚀 ===== NAVIGATING TO JOB SEARCH PAGE =====');
    console.log('   - Keyword:', this.searchKeyword);
    console.log('   - Category IDs:', this.selectedCategoryIds);
    console.log('   - Province IDs:', this.selectedProvinceIds);
    console.log('   - District IDs:', this.selectedDistrictIds);

    // Build query params
    const queryParams: any = {};

    if (this.searchKeyword) {
      queryParams.keyword = this.searchKeyword;
    }

    if (this.selectedCategoryIds.length > 0) {
      queryParams.categoryIds = this.selectedCategoryIds.join(','); // Convert array to comma-separated string
    }

    if (this.selectedProvinceIds.length > 0) {
      queryParams.provinceIds = this.selectedProvinceIds.join(',');
    }

    if (this.selectedDistrictIds.length > 0) {
      queryParams.districtIds = this.selectedDistrictIds.join(',');
    }

    console.log('📤 Query Params:', queryParams);

    // Navigate to /candidate/job with query params
    this.router.navigate(['/candidate/job'], { queryParams });
  }

  /**
   * Event handler: Khi user chọn categories từ FilterBar
   * ✅ AUTO NAVIGATE: Chuyển sang trang job ngay khi chọn category
   */
  onCategorySelected(categoryIds: string[]) {
    this.selectedCategoryIds = categoryIds;
    console.log('✅ Categories selected:', categoryIds);

    // ✅ AUTO NAVIGATE: Chuyển sang trang job ngay lập tức
    if (categoryIds.length > 0) {
      this.performJobSearch();
    }
  }

  /**
   * Event handler: Khi user chọn locations từ FilterBar
   * ✅ AUTO NAVIGATE: Chuyển sang trang job ngay khi chọn location
   */
  onLocationSelected(location: { provinceIds: number[]; districtIds: number[] }) {
    this.selectedProvinceIds = location.provinceIds;
    this.selectedDistrictIds = location.districtIds;
    console.log('✅ Locations selected:');
    console.log('   - Province IDs:', location.provinceIds);
    console.log('   - District IDs:', location.districtIds);

    // ✅ AUTO NAVIGATE: Chuyển sang trang job ngay lập tức
    const totalLocationCount = location.provinceIds.length + location.districtIds.length;
    if (totalLocationCount > 0) {
      this.performJobSearch();
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  onJobClick(jobId: number) {
    console.log('Job clicked:', jobId);
    // Navigate to job details
  }

  onCategoryPageChange(page: number) {
    this.currentCategoryPage = page;
  }

  onCategoryClick(categoryId: number) {
    console.log('Category clicked:', categoryId);
    // Navigate to category jobs
  }

  /**
   * Filter jobs based on selected filters
   * (Tạm thời giữ logic cũ, sau này sẽ call API search)
   */
  filterJobs() {
    // TODO: Call Job Search API với filters
    // const searchInput = {
    //   categoryIds: this.selectedCategoryIds,
    //   provinceIds: this.selectedProvinceIds,
    //   districtIds: this.selectedDistrictIds
    // };
    // this.jobApi.searchJobs(searchInput).subscribe(...)

    this.loadAllJobs(); // Tạm thời load tất cả
  }

  loadAllJobs() {
    // Load lại tất cả việc làm từ dữ liệu gốc
    this.jobListings = [...this.originalJobListings];
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.jobListings.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
