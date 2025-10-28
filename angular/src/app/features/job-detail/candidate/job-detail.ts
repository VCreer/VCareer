import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { SearchHeaderComponent } from '../../../shared/components/search-header/search-header';
import { ApplyJobModalComponent } from '../../../shared/components/apply-job-modal/apply-job-modal';
import { JobApiService } from '../../../proxy/api/job.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastNotificationComponent, SearchHeaderComponent, ApplyJobModalComponent],
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

  // Job data from API
  jobDetail: any = null;
  isLoading: boolean = false;
  jobId: string = '';

  constructor(
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private jobApi: JobApiService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Get job ID from route params
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      if (this.jobId) {
        this.loadJobDetail();
      }
    });
  }

  /**
   * Load job detail from API
   */
  loadJobDetail() {
    this.isLoading = true;
    
    this.jobApi.getJobById(this.jobId).subscribe({
      next: (jobDetail) => {
        this.jobDetail = jobDetail;
        this.isLoading = false;
        console.log('✅ Job detail loaded:', jobDetail);
      },
      error: (error) => {
        console.error('❌ Error loading job detail:', error);
        this.isLoading = false;
        this.toastMessage = 'Không thể tải chi tiết công việc';
        this.showToast = true;
      }
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  toggleHeart(): void {
    this.isHeartActive = !this.isHeartActive;
    if (this.isHeartActive) {
      this.toastMessage = this.translate('job_detail.save_success');
    } else {
      this.toastMessage = this.translate('job_detail.unsave_success');
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
    console.log('Search with params:', {
      category: this.selectedCategory,
      location: this.selectedLocation,
      position: this.searchPosition
    });
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
    console.log('Submitting application with:', {
      cvOption: data.cvOption
    });
    
    // Show toast notification
    if (data.showToast) {
      this.toastMessage = data.toastMessage;
      this.showToast = true;
    }
  }
}
