import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { JobApiService } from '../../../apiTest/api/job.service';
import { NavigationService } from '../../../core/services/navigation.service';
// Import trực tiếp để tránh circular dependency
//import { LoginModalComponent } from '../../services/login-modal/login-modal';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  templateUrl: './job-list.html',
  styleUrls: ['./job-list.scss']
})
export class JobListComponent implements OnInit, OnChanges {
  // ✅ Input from parent (JobComponent)
  @Input() jobs: any[] = []; // ✅ Receive jobs from API
  @Input() totalCount: number = 0; // ✅ Total job count
  @Input() isLoading: boolean = false; // ✅ Loading state
  @Input() selectedJobId: number | null = null;
  
  @Output() searchJobs = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() quickView = new EventEmitter<any>();
  @Output() jobClick = new EventEmitter<any>();
  @Output() jobHidden = new EventEmitter<void>();

  selectedLanguage: string = 'vi';
  currentPage = 1;
  jobsPerPage = 8;
  totalPages = 1; // Will be calculated based on total jobs

  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  showLoginModal = false;
  isAuthenticated = false;
  
  // Search and filter properties
  filteredJobs: any[] = [];
  searchParams: any = {};
  
  // ✅ MOCK DATA (sẽ bị override bởi @Input() jobs từ parent)
  mockJobs = [
    {
      id: 1,
      titleKey: 'job_data.factory_director',
      companyKey: 'job_data.company_ibs',
      logo: 'assets/images/companies/aibs-logo.png',
      locationKey: 'job_data.location_long_an',
      experienceKey: 'job_data.experience_5_years',
      salaryKey: 'job_data.salary_negotiable',
      tags: ['Giám đốc sản xuất', 'Xây dựng', 'Sản xuất', 'Tài chính'],
      description: [
        'Thiết lập và chạy quảng cáo trên các nền tảng Facebook, Google và TikTok.',
        'Đề xuất ý tưởng sáng tạo để làm mới nội dung quảng cáo.',
        'Phân tích số liệu và báo cáo kết quả theo tuần/tháng.'
      ],
      requirements: [
        'Tốt nghiệp Cao đẳng/Đại học chuyên ngành tiếng trung, marketing...',
        'Thành thạo tiếng Trung 4 kỹ năng từ HSK 4',
        'Có kinh nghiệm trong ngành MKT, tiếng Trung, thích chơi game',
        'Tư duy logic, nhạy bén với số liệu, có thể chịu áp lực cao trong công việc.',
        'Tinh thần trách nhiệm cao, làm việc cần thận, tỉ mỉ, nhạy bén với số liệu'
      ],
      benefits: [
        'Phụ cấp thực tập: 5.000.000/ tháng',
        'Thưởng cá nhân theo từng tháng dựa trên mức độ hiệu quả của quảng cáo.',
        'Các chế độ lương, thưởng, phúc lợi theo quy định của pháp luật hiện hành.',
        'Được cung cấp thiết bị làm việc hoặc phụ cấp phí hao mòn tài sản.',
        'Môi trường làm việc trẻ trung, năng động thoải mái. Có đồ ăn vặt mỗi ngày.'
      ],
      workLocation: [
        '- Hồ Chí Minh: 78 Đường số 65, Phường Tân Hưng, Quận 7',
        '- Hồ Chí Minh: Quận 2'
      ],
      workingHours: []
    },
    {
      id: 2,
      titleKey: 'job_data.general_accountant',
      companyKey: 'job_data.company_draho',
      logo: 'assets/images/companies/draho-logo.png',
      locationKey: 'job_data.location_hanoi',
      experienceKey: 'job_data.experience_no_requirement',
      salaryKey: 'job_data.salary_9_20_million',
      tags: ['Kế toán', 'Tài chính', 'Báo cáo']
    },
    {
      id: 3,
      titleKey: 'job_data.digital_marketing_specialist',
      companyKey: 'job_data.company_benavi',
      logo: 'assets/images/companies/benavi-logo.png',
      locationKey: 'job_data.location_hcmc',
      experienceKey: 'job_data.experience_2_years',
      salaryKey: 'job_data.salary_12_20_million',
      tags: ['Marketing', 'Số hóa', 'SEO', 'Mạng xã hội']
    },
    {
      id: 4,
      titleKey: 'job_data.full_stack_developer',
      companyKey: 'job_data.company_tech',
      logo: 'assets/images/companies/tech-logo.png',
      locationKey: 'job_data.location_da_nang',
      experienceKey: 'job_data.experience_3_years',
      salaryKey: 'job_data.salary_45_80_million',
      tags: ['Lập trình', 'Full Stack', 'React', 'Node.js']
    },
    {
      id: 5,
      titleKey: 'job_data.senior_software_engineer',
      companyKey: 'job_data.company_tech_solutions',
      logo: 'assets/images/companies/tech-logo.png',
      locationKey: 'job_data.location_hanoi',
      experienceKey: 'job_data.experience_4_years',
      salaryKey: 'job_data.salary_25_40_million',
      tags: ['Kỹ thuật phần mềm', 'Java', 'Spring', 'Microservices']
    },
    {
      id: 6,
      titleKey: 'job_data.product_manager',
      companyKey: 'job_data.company_innovation',
      logo: 'assets/images/companies/tech-logo.png',
      locationKey: 'job_data.location_hcmc',
      experienceKey: 'job_data.experience_5_years',
      salaryKey: 'job_data.salary_30_50_million',
      tags: ['Quản lý sản phẩm', 'Chiến lược', 'Phân tích', 'Lãnh đạo']
    },
    {
      id: 7,
      titleKey: 'job_data.ux_ui_designer',
      companyKey: 'job_data.company_design_studio',
      logo: 'assets/images/companies/tech-logo.png',
      locationKey: 'job_data.location_da_nang',
      experienceKey: 'job_data.experience_3_years',
      salaryKey: 'job_data.salary_15_25_million',
      tags: ['Thiết kế UX', 'Thiết kế UI', 'Figma', 'Prototyping']
    },
    {
      id: 8,
      titleKey: 'job_data.data_analyst',
      companyKey: 'job_data.company_data_insights',
      logo: 'assets/images/companies/tech-logo.png',
      locationKey: 'job_data.location_hanoi',
      experienceKey: 'job_data.experience_2_years',
      salaryKey: 'job_data.salary_18_30_million',
      tags: ['Phân tích dữ liệu', 'Python', 'SQL', 'Thống kê']
    }
  ];

  constructor(
    private translationService: TranslationService,
    private jobApi: JobApiService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    this.navigationService.isLoggedIn$.subscribe(isLogged => {
      this.isAuthenticated = isLogged;
    });
    // Initialize filteredJobs with all jobs
    this.updateFilteredJobs();
  }

  /**
   * ✅ Update filteredJobs khi @Input() jobs thay đổi
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['jobs'] && this.jobs) {
      console.log('\n🔄 JobListComponent: Received new jobs from parent');
      console.log('   📦 Jobs count:', this.jobs.length);
      console.log('   📊 Total count:', this.totalCount);
      console.log('   📄 Jobs data:', this.jobs);
      
      this.updateFilteredJobs();
    }
  }

  /**
   * ✅ Helper: Update filteredJobs và recalculate pagination
   */
  private updateFilteredJobs() {
    this.filteredJobs = [...this.jobs];
    this.calculateTotalPages();
    
    console.log('✅ JobListComponent: filteredJobs updated');
    console.log('   📄 Filtered count:', this.filteredJobs.length);
    console.log('   📑 Total pages:', this.totalPages);
    // Backend đã trả isSaved trong JobViewDto, không cần gọi API thêm
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredJobs.length / this.jobsPerPage);
  }

  getPaginatedJobs() {
    const startIndex = (this.currentPage - 1) * this.jobsPerPage;
    const endIndex = startIndex + this.jobsPerPage;
    return this.filteredJobs.slice(startIndex, endIndex);
  }

  // Search and filter methods
  applySearch(searchParams: any) {
    this.searchParams = searchParams;
    this.filterJobs();
  }

  filterJobs() {
    let filtered = [...this.jobs];

    // Filter by position
    if (this.searchParams.position && this.searchParams.position.trim()) {
      filtered = filtered.filter(job => 
        this.translate(job.titleKey).toLowerCase().includes(this.searchParams.position.toLowerCase())
      );
    }

    // Filter by category
    if (this.searchParams.category && this.searchParams.category !== '') {
      // Add category filtering logic here
      // For now, we'll filter by company type or job type
    }

    // Filter by location - handle different location formats
    if (this.searchParams.location && this.searchParams.location !== '') {
      const locationKey = `job_data.location_${this.searchParams.location}`;
      filtered = filtered.filter(job => 
        job.locationKey === locationKey
      );
    }

    // Apply additional filters from filter component
    // Map filter values to job data format
    const experienceMap: any = {
      'none': 'job_data.experience_no_requirement',
      'under1': 'job_data.experience_under_1_year',
      '1year': 'job_data.experience_1_year',
      '2years': 'job_data.experience_2_years',
      '3years': 'job_data.experience_3_years',
      '4years': 'job_data.experience_4_years',
      '5years': 'job_data.experience_5_years',
      'over5': 'job_data.experience_over_5_years'
    };

    if (this.searchParams.experience && this.searchParams.experience !== 'all') {
      const experienceKey = experienceMap[this.searchParams.experience];
      if (experienceKey) {
        filtered = filtered.filter(job => 
          job.experienceKey === experienceKey
        );
      }
    }

    if (this.searchParams.jobLevel && this.searchParams.jobLevel !== 'all') {
      // Map job level filter values to keywords in job titles/tags
      const jobLevelKeywords: any = {
        'intern': ['thực tập', 'intern'],
        'staff': ['nhân viên'],
        'team-lead': ['trưởng nhóm'],
        'head-department': ['trưởng phòng', 'phó phòng'],
        'manager': ['quản lý', 'giám sát'],
        'branch-manager': ['trưởng chi nhánh'],
        'deputy-director': ['phó giám đốc'],
        'director': ['giám đốc', 'director']
      };
      
      const keywords = jobLevelKeywords[this.searchParams.jobLevel];
      if (keywords) {
        filtered = filtered.filter(job => {
          const jobTitle = this.translate(job.titleKey).toLowerCase();
          const jobTags = job.tags.join(' ').toLowerCase();
          const allText = `${jobTitle} ${jobTags}`.toLowerCase();
          
          return keywords.some(keyword => allText.includes(keyword));
        });
      }
    }

    if (this.searchParams.workType && this.searchParams.workType !== 'all') {
      // Map work type filter values to keywords
      const workTypeKeywords: any = {
        'full_time': ['toàn thời gian', 'full time'],
        'part_time': ['bán thời gian', 'part time'],
        'internship': ['thực tập', 'internship'],
        'other': ['khác', 'other']
      };
      
      const keywords = workTypeKeywords[this.searchParams.workType];
      if (keywords) {
        filtered = filtered.filter(job => {
          const jobTitle = this.translate(job.titleKey).toLowerCase();
          const jobTags = job.tags.join(' ').toLowerCase();
          const allText = `${jobTitle} ${jobTags}`.toLowerCase();
          
          return keywords.some(keyword => allText.includes(keyword));
        });
      }
    }

    if (this.searchParams.salary && this.searchParams.salary !== 'all') {
      // Salary range mapping
      const salaryRanges: any = {
        'under_10': { min: 0, max: 10 },
        '10_15': { min: 10, max: 15 },
        '15_20': { min: 15, max: 20 },
        '20_25': { min: 20, max: 25 },
        '25_30': { min: 25, max: 30 },
        '30_50': { min: 30, max: 50 },
        'over_50': { min: 50, max: Infinity },
        'negotiable': null // Special case for negotiable
      };
      
      const selectedRange = salaryRanges[this.searchParams.salary];
      
      if (this.searchParams.salary === 'negotiable') {
        // Filter for negotiable salary
        filtered = filtered.filter(job => 
          job.salaryKey === 'job_data.salary_negotiable'
        );
      } else if (selectedRange) {
        // Filter based on salary range overlap
        filtered = filtered.filter(job => {
          // Parse salary from job data
          let jobMin = 0, jobMax = Infinity;
          
          if (job.salaryKey === 'job_data.salary_negotiable') {
            return true; // Include negotiable in all ranges
          }
          
          // Extract numbers from salary key
          const match = job.salaryKey.match(/(\d+)_(\d+)_million/);
          if (match) {
            jobMin = parseInt(match[1]);
            jobMax = parseInt(match[2]);
          } else {
            const singleMatch = job.salaryKey.match(/(\d+)_million/);
            if (singleMatch) {
              jobMin = parseInt(singleMatch[1]);
              jobMax = parseInt(singleMatch[1]);
            }
          }
          
          // Check if salary ranges overlap
          return jobMin < selectedRange.max && jobMax > selectedRange.min;
        });
      }
    }

    this.filteredJobs = filtered;
    this.currentPage = 1; // Reset to first page
    this.calculateTotalPages();
  }

  clearFilters() {
    this.searchParams = {};
    this.filteredJobs = [...this.jobs];
    this.currentPage = 1;
    this.calculateTotalPages();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onJobClick(job: any) {
    console.log('Job clicked:', job);
    // Emit job click event to parent component
    this.jobClick.emit(job);
  }

  onSaveJob(job: any) {
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      return;
    }

    if (!job || !job.id) return;

    if (job.isSaved) {
      this.jobApi.unsaveJob(job.id).subscribe({
        next: () => {
          job.isSaved = false;
          this.showSuccessToast('Đã bỏ lưu công việc khỏi danh sách yêu thích');
        },
        error: () => {
          this.showSuccessToast('Không thể bỏ lưu công việc');
        }
      });
    } else {
      this.jobApi.saveJob(job.id).subscribe({
        next: () => {
          job.isSaved = true;
          this.showSuccessToast('Đã lưu công việc vào danh sách yêu thích');
        },
        error: () => {
          this.showSuccessToast('Không thể lưu công việc');
        }
      });
    }
  }

  onSearchJobs(searchParams: any) {
    this.applySearch(searchParams);
  }


  onQuickView(job: any) {
    console.log('Quick view job:', job);
    // Emit quick view event
    this.quickView.emit(job);
  }

  hideJob(job: any) {
    console.log('Hide job:', job);
    // Handle hide job logic - remove job from both arrays
    const indexInJobs = this.jobs.findIndex(j => j.id === job.id);
    const indexInFiltered = this.filteredJobs.findIndex(j => j.id === job.id);
    
    if (indexInJobs > -1) {
      this.jobs.splice(indexInJobs, 1);
    }
    
    if (indexInFiltered > -1) {
      this.filteredJobs.splice(indexInFiltered, 1);
    }
    
    this.showSuccessToast(this.translate('job_list.hide_success'));
    this.calculateTotalPages(); // Recalculate total pages after removing job
    
    // If the hidden job is the currently selected job, emit event to reset selection
    if (this.selectedJobId === job.id) {
      this.jobHidden.emit();
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.pageChange.emit(page);
    this.calculateTotalPages();
  }


  showSuccessToast(message: string) {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
  }

  onToastClose() {
    this.showToast = false;
  }

  // Login modal handlers
  onLoginClose() { this.showLoginModal = false; }
  onLoginSuccess() {
    this.showLoginModal = false;
    this.isAuthenticated = true;
    // Reload lại trang để gọi lại API search với token mới (để có isSaved)
    window.location.reload();
  }

  showQuickViewButton(): boolean {
    return this.selectedJobId === null;
  }
}
