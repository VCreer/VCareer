import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterOptionsService, FilterOption } from '../../../../core/services/filter-options.service';

// Import shared components
import { HeroSectionComponent } from '../../../../shared/components/hero-section/hero-section.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { JobListingsComponent } from '../../../../shared/components/job-listings/job-listings.component';
import { CategorySectionComponent } from '../../../../shared/components/category-section/category-section.component';
import { AboutUsComponent } from '../../../../shared/components/about-us/about-us.component';
import { StatisticsComponent } from '../../../../shared/components/statistics/statistics.component';
import { FutureHeroComponent } from '../../../../shared/components/future-hero/future-hero.component';

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
    FutureHeroComponent
  ],
  templateUrl: './candidate-homepage.component.html',
  styleUrls: ['./candidate-homepage.component.scss']
})
export class CandidateHomepageComponent implements OnInit {
  // Dữ liệu form tìm kiếm
  searchForm = {
    jobTitle: '',
    location: '',
    category: ''
  };

  // Dữ liệu thống kê
  stats = {
    jobs: '25,850',
    candidates: '10,250', 
    companies: '18,400'
  };

  // Statistics data for component
  statisticsData = [
    {
      number: '12k+',
      title: 'stats.customers_title',
      description: 'stats.customers_desc'
    },
    {
      number: '20k+',
      title: 'stats.resumes_title',
      description: 'stats.resumes_desc'
    },
    {
      number: '18k+',
      title: 'stats.companies_title',
      description: 'stats.companies_desc'
    }
  ];

  // Filter properties
  selectedFilter = 'Địa điểm';
  showFilterDropdown = false;
  selectedLocation = '';
  currentFilterOptions: FilterOption[] = [];
  displayedOptions: FilterOption[] = [];
  remainingOptions: FilterOption[] = [];
  currentIndex = 0;
  visibleCount = 7;
  isLoading = false;
  
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

  // Dữ liệu danh mục - Trang 1
  categories = [
    // Trang 1: Categories chính
    {
      id: 1,
      name: 'Kinh doanh - Bán hàng',
      jobCount: 10016,
      image: 'assets/images/home/Browse-by-category/kinh-doanh-ban-hang.png'
    },
    {
      id: 2,
      name: 'Marketing - PR - Quảng cáo',
      jobCount: 7157,
      image: 'assets/images/home/Browse-by-category/marketing-truyen-thong-quang-cao.png'
    },
    {
      id: 3,
      name: 'Chăm sóc khách hàng',
      jobCount: 2450,
      image: 'assets/images/home/Browse-by-category/dich-vu-khach-hang.png'
    },
    {
      id: 4,
      name: 'Nhân sự - Hành chính',
      jobCount: 2908,
      image: 'assets/images/home/Browse-by-category/hanh-chinh-van-phong.png'
    },
    {
      id: 5,
      name: 'Công nghệ Thông tin',
      jobCount: 2171,
      image: 'assets/images/home/Browse-by-category/cong-nghe-thong-tin.png'
    },
    {
      id: 6,
      name: 'Tài chính - Ngân hàng',
      jobCount: 1583,
      image: 'assets/images/home/Browse-by-category/ngan-hang-tai-chinh.png'
    },
    {
      id: 7,
      name: 'Bất động sản',
      jobCount: 359,
      image: 'assets/images/home/Browse-by-category/bat-dong-san.png'
    },
    {
      id: 8,
      name: 'Kế toán - Kiểm toán',
      jobCount: 5288,
      image: 'assets/images/home/Browse-by-category/ke-toan-kiem-toan.png'
    },
    // Trang 2: Categories bổ sung
    {
      id: 9,
      name: 'Sản xuất',
      jobCount: 3533,
      image: 'assets/images/home/Browse-by-category/san-xuat.png'
    },
    {
      id: 10,
      name: 'Giáo dục - Đào tạo',
      jobCount: 1973,
      image: 'assets/images/home/Browse-by-category/giao-duc-dao-tao.png'
    },
    {
      id: 11,
      name: 'Bán lẻ - Dịch vụ đời sống',
      jobCount: 796,
      image: 'assets/images/home/Browse-by-category/ban-le-ban-si.png'
    },
    {
      id: 12,
      name: 'Phim và truyền hình - Báo chí',
      jobCount: 273,
      image: 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png'
    },
    {
      id: 13,
      name: 'Điện - Điện tử - Viễn thông',
      jobCount: 1687,
      image: 'assets/images/home/Browse-by-category/dien-tu-vien-thong.png'
    },
    {
      id: 14,
      name: 'Logistics - Thu mua - Kho vận',
      jobCount: 2378,
      image: 'assets/images/home/Browse-by-category/logistics.png'
    },
    {
      id: 15,
      name: 'Tư vấn chuyên môn',
      jobCount: 124,
      image: 'assets/images/home/Browse-by-category/tu-van.png'
    },
    {
      id: 16,
      name: 'Dược - Y tế - Sức khỏe',
      jobCount: 848,
      image: 'assets/images/home/Browse-by-category/y-te-duoc.png'
    },
    // Trang 3: Categories khác
    {
      id: 17,
      name: 'Thiết kế',
      jobCount: 943,
      image: 'assets/images/home/Browse-by-category/thiet-ke-do-hoa.png'
    },
    {
      id: 18,
      name: 'Nhà hàng - Khách sạn',
      jobCount: 1125,
      image: 'assets/images/home/Browse-by-category/khach-san-nha-hang.png'
    },
    {
      id: 19,
      name: 'Năng lượng - Môi trường',
      jobCount: 359,
      image: 'assets/images/home/Browse-by-category/nong-lam-ngu-nghiep.png'
    },
    {
      id: 20,
      name: 'Nhóm nghề khác',
      jobCount: 502,
      image: 'assets/images/home/Browse-by-category/nganh-nghe-khac.png'
    }
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
      isBookmarked: false
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
      isBookmarked: false
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
      isBookmarked: false
    }
  ];

  constructor(
    private router: Router,
    private filterOptionsService: FilterOptionsService
  ) {}

  ngOnInit() {
    this.loadFilterOptions();
    this.loadAllJobs(); // Khởi tạo danh sách việc làm
    this.updateCategoryPagination();
  }

  loadFilterOptions() {
    this.isLoading = true;
    this.filterOptionsService.getFilterOptions(this.selectedFilter).subscribe({
      next: (options) => {
        this.currentFilterOptions = options;
        this.splitOptions();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  splitOptions() {
    // Chỉ áp dụng cho địa điểm
    if (this.selectedFilter === 'Địa điểm') {
      this.currentIndex = 0;
      this.updateDisplayedOptions();
    } else {
      // Các filter khác hiển thị tất cả
      this.displayedOptions = this.currentFilterOptions;
      this.remainingOptions = [];
    }
  }

  updateDisplayedOptions() {
    const startIndex = this.currentIndex;
    const endIndex = startIndex + this.visibleCount;
    this.displayedOptions = this.currentFilterOptions.slice(startIndex, endIndex);
    
    // Cập nhật remaining options - chỉ hiển thị khi còn địa điểm
    const remainingStartIndex = endIndex;
    this.remainingOptions = this.currentFilterOptions.slice(remainingStartIndex);
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
    this.totalCategoryPages = Math.ceil(this.categories.length / this.categoriesPerPage);
  }

  getCurrentPageCategories() {
    const startIndex = (this.currentCategoryPage - 1) * this.categoriesPerPage;
    const endIndex = startIndex + this.categoriesPerPage;
    return this.categories.slice(startIndex, endIndex);
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

  // Event handlers for components
  onSearch(searchData: any) {
    console.log('Search data:', searchData);
    // Handle search logic
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
  }

  onLocationChange(location: string) {
    this.selectedLocation = location;
    this.filterJobs();
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

  toggleFilterDropdown() {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  selectFilter(filter: string) {
    this.selectedFilter = filter;
    this.showFilterDropdown = false;
    this.selectedLocation = ''; // Reset selected location
    this.loadFilterOptions(); // Load new options
  }

  selectLocation(location: string) {
    this.selectedLocation = this.selectedLocation === location ? '' : location;
    this.filterJobs();
  }

  filterJobs() {
    // Lọc việc làm dựa trên filter đã chọn
    if (this.selectedLocation) {
      const selected = this.selectedLocation.toLowerCase();
      this.jobListings = this.originalJobListings.filter(job => {
        const jobDistrict = (job as any).district ? String((job as any).district).toLowerCase() : '';
        const jobLocation = job.location ? String(job.location).toLowerCase() : '';
        // Ưu tiên khớp theo huyện nếu có, fallback sang location để không phá UI hiện tại
        return (jobDistrict && jobDistrict.includes(selected)) || jobLocation.includes(selected);
      });
    } else {
      // Nếu không chọn location, hiển thị tất cả
      this.loadAllJobs();
    }
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

  scrollLeft() {
    if (this.selectedFilter === 'Địa điểm' && this.currentIndex >= this.visibleCount) {
      this.currentIndex -= this.visibleCount; // Di chuyển 7 tags
      this.updateDisplayedOptions();
    } else {
      // Scroll horizontal cho các filter khác
      const filterTags = document.querySelector('.filter-tags') as HTMLElement;
      if (filterTags) {
        filterTags.scrollBy({ left: -200, behavior: 'smooth' });
      }
    }
  }

  scrollRight() {
    if (this.selectedFilter === 'Địa điểm' && this.currentIndex < this.currentFilterOptions.length - this.visibleCount) {
      this.currentIndex += this.visibleCount; // Di chuyển 7 tags
      this.updateDisplayedOptions();
    } else {
      // Scroll horizontal cho các filter khác
      const filterTags = document.querySelector('.filter-tags') as HTMLElement;
      if (filterTags) {
        filterTags.scrollBy({ left: 200, behavior: 'smooth' });
      }
    }
  }



}
