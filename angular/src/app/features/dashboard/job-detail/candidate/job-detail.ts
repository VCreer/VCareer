import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of, forkJoin } from 'rxjs';

import { TranslationService } from '../../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { SearchHeaderComponent } from '../../../../shared/components/search-header/search-header';
import { ApplyJobModalComponent } from '../../../../shared/components/apply-job-modal/apply-job-modal';

// API imports
import { JobViewDetail } from '../../../../proxy/dto/job';
import { JobSearchService } from 'src/app/proxy/services/job';
import { GeoService } from 'src/app/proxy/services/geo';
import { CategoryTreeDto } from 'src/app/proxy/dto/category';
import { JobCategoryService } from 'src/app/proxy/services/job';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ToastNotificationComponent,
    SearchHeaderComponent,
    ApplyJobModalComponent
  ],
  templateUrl: './job-detail.html',
  styleUrls: ['./job-detail.scss']
})
export class JobDetailComponent implements OnInit {
  selectedLanguage: string = 'vi';
  isHeartActive: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  selectedCategory: string = '';
  selectedLocation: string = '';
  searchPosition: string = '';
  showApplyModal: boolean = false;

  // Job detail data
  jobId: string = '';
  jobDetail: JobViewDetail | null = null;
  isLoadingJob: boolean = false;

  // Categories and provinces for search header
  categories: CategoryTreeDto[] = [];
  provinces: any[] = [];

  // Computed properties
  categoryName: string = '';
  provinceName: string = '';
  wardName: string = '';

  constructor(
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private router: Router,
    private jobSearchService: JobSearchService,
    private categoryService: JobCategoryService,
    private geoService: GeoService
  ) {
    console.log('🏗️ JobDetailComponent constructor called');
  }

  ngOnInit() {
    console.log('🚀 JobDetailComponent ngOnInit called');

    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Get jobId from route params
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      console.log('📌 Job ID from route:', this.jobId);

      if (this.jobId) {
        this.loadJobDetail();
        this.loadCategoriesAndProvinces();
      } else {
        console.error('❌ No job ID found in route');
        this.router.navigate(['/candidate/job']);
      }
    });

    // Check if openApplyModal query parameter is present
    this.route.queryParams.subscribe(params => {
      if (params['openApplyModal'] === 'true') {
        setTimeout(() => {
          this.showApplyModal = true;
        }, 100);
      }
    });
  }

  /**
   * ✅ Load job detail from API
   */
  loadJobDetail() {
    console.log('📥 Loading job detail for ID:', this.jobId);
    this.isLoadingJob = true;

    this.jobSearchService.getJobById(this.jobId).pipe(
      catchError(error => {
        console.error('❌ Error loading job detail:', error);
        this.toastMessage = this.translate('job_detail.error_loading');
        this.showToast = true;
        return of(null);
      })
    ).subscribe({
      next: (job) => {
        this.jobDetail = job;
        this.isLoadingJob = false;

        if (job) {
          console.log('✅ Loaded job detail:', job);
          this.processCategoriesAndLocations();
        } else {
          console.error('❌ Job not found');
          this.router.navigate(['/candidate/job']);
        }
      },
      error: (error) => {
        console.error('❌ Critical error loading job:', error);
        this.isLoadingJob = false;
        this.router.navigate(['/candidate/job']);
      }
    });
  }

  /**
   * ✅ Load categories and provinces for search header
   */
  loadCategoriesAndProvinces() {
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
          return of([]);
        })
      )
    }).subscribe({
      next: data => {
        this.categories = data.categories || [];
        this.provinces = data.provinces || [];
        console.log('✅ Loaded categories:', this.categories.length);
        console.log('✅ Loaded provinces:', this.provinces.length);
      }
    });
  }

  /**
   * ✅ Process categories and locations to get names
   */
  async processCategoriesAndLocations() {
    if (!this.jobDetail) return;

    // Get category name from jobCategoryId
    if (this.jobDetail.jobCategoryId) {
      const category = this.findCategory(this.categories, this.jobDetail.jobCategoryId);
      if (category && category.categoryName) {
        this.categoryName = category.categoryName;
        console.log('✅ Category name:', this.categoryName);
      }
    }

    // Get province name from provinceCode
    if (this.jobDetail.provinceCode){
      try {
        const name = await this.geoService
          .getProvinceNameByCodeByProvinceCode(this.jobDetail.provinceCode)
          .toPromise();
        if (name) {
          this.provinceName = name;
          console.log('✅ Province name:', this.provinceName);
        }
      } catch (error) {
        console.error('Error getting province name:', error);
      }
    }

    // Get ward name from wardCode and provinceCode
    if (this.jobDetail.wardCode && this.jobDetail.provinceCode) {
      try {
        const name = await this.geoService
          .getWardNameByCodeByWardCodeAndProvinceCode(
            this.jobDetail.wardCode,
            this.jobDetail.provinceCode
          )
          .toPromise();
        if (name) {
          this.wardName = name;
          console.log('✅ Ward name:', this.wardName);
        }
      } catch (error) {
        console.error('Error getting ward name:', error);
      }
    }
  }

  /**
   * ✅ Find category by ID (recursive)
   */
  findCategory(cats: CategoryTreeDto[], id: string): CategoryTreeDto | null {
    for (const cat of cats) {
      if (cat.categoryId === id) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = this.findCategory(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * ✅ Get location display text
   */
  getLocationDisplay(): string {
    const locations: string[] = [];
    if (this.wardName) locations.push(this.wardName);
    if (this.provinceName) locations.push(this.provinceName);
    
    return locations.length > 0 
      ? locations.join(', ') 
      : this.translate('job_detail.not_specified');
  }

  /**
   * ✅ Format salary display
   */
  getSalaryDisplay(): string {
    if (!this.jobDetail) return '';

    if (this.jobDetail.salaryDeal) {
      return this.translate('job_detail.salary_negotiable');
    }

    if (this.jobDetail.salaryMin && this.jobDetail.salaryMax) {
      return `${this.formatSalary(this.jobDetail.salaryMin)} - ${this.formatSalary(this.jobDetail.salaryMax)}`;
    }

    if (this.jobDetail.salaryMin) {
      return `${this.translate('job_detail.from')} ${this.formatSalary(this.jobDetail.salaryMin)}`;
    }

    return this.translate('job_detail.salary_competitive');
  }

  /**
   * ✅ Format salary number
   */
  formatSalary(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} ${this.translate('job_detail.million')}`;
    }
    return `${amount.toLocaleString('vi-VN')} VNĐ`;
  }

  /**
   * ✅ Get experience level text
   */
  getExperienceText(): string {
    if (!this.jobDetail || this.jobDetail.experience === undefined) {
      return this.translate('job_detail.not_required');
    }

    const experienceMap: { [key: number]: string } = {
      0: 'job_detail.no_experience',
      1: 'job_detail.under_1_year',
      2: 'job_detail.1_2_years',
      3: 'job_detail.2_5_years',
      4: 'job_detail.over_5_years'
    };

    return this.translate(experienceMap[this.jobDetail.experience] || 'job_detail.not_required');
  }

  /**
   * ✅ Get employment type text
   */
  getEmploymentTypeText(): string {
    if (!this.jobDetail || this.jobDetail.employmentType === undefined) {
      return this.translate('job_detail.full_time');
    }

    const typeMap: { [key: number]: string } = {
      0: 'job_detail.full_time',
      1: 'job_detail.part_time',
      2: 'job_detail.contract',
      3: 'job_detail.internship'
    };

    return this.translate(typeMap[this.jobDetail.employmentType] || 'job_detail.full_time');
  }

  /**
   * ✅ Get position type text
   */
  getPositionTypeText(): string {
    if (!this.jobDetail || this.jobDetail.positionType === undefined) {
      return this.translate('job_detail.staff');
    }

    const positionMap: { [key: number]: string } = {
      0: 'job_detail.intern',
      1: 'job_detail.staff',
      2: 'job_detail.team_leader',
      3: 'job_detail.manager',
      4: 'job_detail.director'
    };

    return this.translate(positionMap[this.jobDetail.positionType] || 'job_detail.staff');
  }

  /**
   * ✅ Format deadline date
   */
  getDeadlineText(): string {
    if (!this.jobDetail || !this.jobDetail.expiresAt) {
      return this.translate('job_detail.open');
    }

    const deadline = new Date(this.jobDetail.expiresAt);
    return deadline.toLocaleDateString('vi-VN');
  }

  /**
   * ✅ Format posted date
   */
  getPostedDate(): string {
    if (!this.jobDetail || !this.jobDetail.postedAt) {
      return '';
    }

    const posted = new Date(this.jobDetail.postedAt);
    return posted.toLocaleDateString('vi-VN');
  }

  /**
   * ✅ Get time ago text
   */
  getTimeAgo(): string {
    if (!this.jobDetail || !this.jobDetail.postedAt) {
      return '';
    }

    const now = new Date();
    const posted = new Date(this.jobDetail.postedAt);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} ${this.translate('job_detail.minutes_ago')}`;
      }
      return `${diffHours} ${this.translate('job_detail.hours_ago')}`;
    }
    
    if (diffDays < 30) {
      return `${diffDays} ${this.translate('job_detail.days_ago')}`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} ${this.translate('job_detail.months_ago')}`;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  toggleHeart(): void {
    this.isHeartActive = !this.isHeartActive;
    if (this.isHeartActive) {
      this.toastMessage = this.translate('job_detail.save_success');
      // TODO: Call API to save job
    } else {
      this.toastMessage = this.translate('job_detail.unsave_success');
      // TODO: Call API to unsave job
    }
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value;
  }

  onLocationChange(event: any): void {
    this.selectedLocation = event.target.value;
  }

  onPositionChange(event: any): void {
    this.searchPosition = event.target.value;
  }

  onSearch(): void {
    console.log('🔍 Search from job detail:', {
      category: this.selectedCategory,
      location: this.selectedLocation,
      position: this.searchPosition
    });

    // Navigate to job search page with filters
    const queryParams: any = {};
    if (this.selectedCategory) queryParams.categoryIds = this.selectedCategory;
    if (this.selectedLocation) queryParams.provinceIds = this.selectedLocation;
    if (this.searchPosition) queryParams.keyword = this.searchPosition;

    this.router.navigate(['/candidate/job'], { queryParams });
  }

  onClearPosition(): void {
    this.searchPosition = '';
  }

  openApplyModal(): void {
    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  onModalSubmit(data: {cvOption: string, showToast: boolean, toastMessage: string}): void {
    console.log('📝 Submitting application for job:', this.jobId, {
      cvOption: data.cvOption
    });
    
    // TODO: Call API to submit application
    
    if (data.showToast) {
      this.toastMessage = data.toastMessage;
      this.showToast = true;
    }
  }

  /**
   * ✅ Navigate to company detail
   */
  viewCompanyDetail(): void {
    if (this.jobDetail && this.jobDetail.companyId) {
      this.router.navigate(['/candidate/company-detail', this.jobDetail.companyId]);
    }
  }
}