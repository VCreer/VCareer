import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { JobApiService } from '../../../apiTest/api/job.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { Router } from '@angular/router';
import { GeoService } from '../../../core/services/Geo.service';
import { ExperienceLevel } from '../../../proxy/constants/job-constant/experience-level.enum';
// Import trực tiếp để tránh circular dependency
//import { LoginModalComponent } from '../../services/login-modal/login-modal';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  templateUrl: './job-list.html',
  styleUrls: ['./job-list.scss'],
})
export class JobListComponent implements OnInit, OnChanges {
  // ✅ Input from parent (JobComponent)
  @Input() jobs: any[] = []; // ✅ Receive jobs from API
  @Input() totalCount: number = 0; // ✅ Total job count
  @Input() isLoading: boolean = false; // ✅ Loading state
  @Input() selectedJobId: number | null = null;
  @Input() provinces: any[] = []; // ✅ Provinces để lookup province name

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

  constructor(
    private translationService: TranslationService,
    private jobApi: JobApiService,
    private navigationService: NavigationService,
    private router: Router,
    private geoService: GeoService
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
    // Map JobViewDto từ API sang format mà template expect
    this.filteredJobs = this.jobs.map(job => this.mapJobToTemplateFormat(job));
    this.calculateTotalPages();

    console.log('✅ JobListComponent: filteredJobs updated');
    console.log('   📄 Filtered count:', this.filteredJobs.length);
    console.log('   📑 Total pages:', this.totalPages);
  }

  /**
   * Map JobViewDto từ API sang format template expect
   */
  private mapJobToTemplateFormat(job: any): any {
    return {
      ...job,
      // Map logo
      logo: job.companyImageUrl || 'assets/images/vng.png',
      // Map company name (bỏ "Tập đoàn" prefix vì template đã có)
      company: job.companyName || 'N/A',
      // Map salary
      salaryText: this.formatSalary(job),
      // Map province name (cần lookup từ provinceCode)
      provinceName: this.getProvinceName(job.provinceCode) || 'N/A',
      // Map experience
      experienceText: this.formatExperience(job.experience) || 'N/A',
    };
  }

  /**
   * Format salary từ JobViewDto
   */
  private formatSalary(job: any): string {
    if (job.salaryDeal) {
      return 'Thỏa thuận';
    }
    if (job.salaryMin && job.salaryMax) {
      return `${this.formatNumber(job.salaryMin)} - ${this.formatNumber(job.salaryMax)} VNĐ`;
    }
    if (job.salaryMin) {
      return `Từ ${this.formatNumber(job.salaryMin)} VNĐ`;
    }
    return 'N/A';
  }

  /**
   * Format số với dấu phẩy
   */
  private formatNumber(num: number): string {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('vi-VN');
  }

  /**
   * Format experience level
   */
  private formatExperience(level: any): string {
    if (level === undefined || level === null) return '';
    const levelMap: { [key: number]: string } = {
      [ExperienceLevel.None]: 'Không yêu cầu',
      [ExperienceLevel.Under1]: 'Dưới 1 năm',
      [ExperienceLevel.Year1]: '1 năm',
      [ExperienceLevel.Year2]: '2 năm',
      [ExperienceLevel.Year3]: '3 năm',
      [ExperienceLevel.Year4]: '4 năm',
      [ExperienceLevel.Year5]: '5 năm',
      [ExperienceLevel.Year6]: '6 năm',
      [ExperienceLevel.Year7]: '7 năm',
      [ExperienceLevel.Year8]: '8 năm',
      [ExperienceLevel.Year9]: '9 năm',
      [ExperienceLevel.Year10]: '10 năm',
      [ExperienceLevel.Over10]: 'Trên 10 năm'
    };
    return levelMap[level] || String(level);
  }

  /**
   * Get province name từ provinceCode
   */
  private getProvinceName(provinceCode: number): string {
    if (!provinceCode) return '';
    
    // Nếu có provinces từ input, lookup từ đó
    if (this.provinces && this.provinces.length > 0) {
      const province = this.provinces.find((p: any) => p.code === provinceCode);
      if (province) return province.name || '';
    }
    
    // Fallback: return code
    return `Mã: ${provinceCode}`;
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
        this.translate(job.titleKey)
          .toLowerCase()
          .includes(this.searchParams.position.toLowerCase())
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
      filtered = filtered.filter(job => job.locationKey === locationKey);
    }

    // Apply additional filters from filter component
    // Map filter values to job data format
    const experienceMap: any = {
      none: 'job_data.experience_no_requirement',
      under1: 'job_data.experience_under_1_year',
      '1year': 'job_data.experience_1_year',
      '2years': 'job_data.experience_2_years',
      '3years': 'job_data.experience_3_years',
      '4years': 'job_data.experience_4_years',
      '5years': 'job_data.experience_5_years',
      over5: 'job_data.experience_over_5_years',
    };

    if (this.searchParams.experience && this.searchParams.experience !== 'all') {
      const experienceKey = experienceMap[this.searchParams.experience];
      if (experienceKey) {
        filtered = filtered.filter(job => job.experienceKey === experienceKey);
      }
    }

    if (this.searchParams.jobLevel && this.searchParams.jobLevel !== 'all') {
      // Map job level filter values to keywords in job titles/tags
      const jobLevelKeywords: any = {
        intern: ['thực tập', 'intern'],
        staff: ['nhân viên'],
        'team-lead': ['trưởng nhóm'],
        'head-department': ['trưởng phòng', 'phó phòng'],
        manager: ['quản lý', 'giám sát'],
        'branch-manager': ['trưởng chi nhánh'],
        'deputy-director': ['phó giám đốc'],
        director: ['giám đốc', 'director'],
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
        full_time: ['toàn thời gian', 'full time'],
        part_time: ['bán thời gian', 'part time'],
        internship: ['thực tập', 'internship'],
        other: ['khác', 'other'],
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
        under_10: { min: 0, max: 10 },
        '10_15': { min: 10, max: 15 },
        '15_20': { min: 15, max: 20 },
        '20_25': { min: 20, max: 25 },
        '25_30': { min: 25, max: 30 },
        '30_50': { min: 30, max: 50 },
        over_50: { min: 50, max: Infinity },
        negotiable: null, // Special case for negotiable
      };

      const selectedRange = salaryRanges[this.searchParams.salary];

      if (this.searchParams.salary === 'negotiable') {
        // Filter for negotiable salary
        filtered = filtered.filter(job => job.salaryKey === 'job_data.salary_negotiable');
      } else if (selectedRange) {
        // Filter based on salary range overlap
        filtered = filtered.filter(job => {
          // Parse salary from job data
          let jobMin = 0,
            jobMax = Infinity;

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
    if (!job || !job.id) return;
    
    // Trigger quickView để hiển thị detail panel thay vì navigate
    this.onQuickView(job);
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
        },
      });
    } else {
      this.jobApi.saveJob(job.id).subscribe({
        next: () => {
          job.isSaved = true;
          this.showSuccessToast('Đã lưu công việc vào danh sách yêu thích');
        },
        error: () => {
          this.showSuccessToast('Không thể lưu công việc');
        },
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
  onLoginClose() {
    this.showLoginModal = false;
  }
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
