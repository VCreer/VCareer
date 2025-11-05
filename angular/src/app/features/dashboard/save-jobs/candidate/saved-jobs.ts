import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { JobApiService, SavedJobDto, JobViewDto } from '../../../../apiTest/api/job.service';

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './saved-jobs.html',
  styleUrls: ['./saved-jobs.scss']
})
export class SavedJobsComponent implements OnInit {
  savedJobs: SavedJobDto[] = [];
  loading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  totalCount = 0;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private jobApi: JobApiService
  ) {}

  ngOnInit() {
    this.loadSavedJobs();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getJobsCountText(): string {
    const count = this.savedJobs.length;
    if (count === 0) {
      return this.translate('saved_jobs.no_jobs_count');
    } else if (count === 1) {
      return this.translate('saved_jobs.list_count_one');
    } else {
      return this.translate('saved_jobs.list_count').replace('{{count}}', count.toString());
    }
  }

  loadSavedJobs() {
    this.loading = true;
    this.jobApi.getSavedJobs(0, 100).subscribe({
      next: (result) => {
        this.savedJobs = result.items || [];
        this.totalCount = result.totalCount || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading saved jobs:', error);
        this.loading = false;
        this.showToastMessage('Không thể tải danh sách công việc đã lưu', 'error');
      }
    });
  }

  onApplyJob(job: SavedJobDto) {
    this.router.navigate(['/candidate/job-detail', job.jobId], { 
      queryParams: { openApplyModal: 'true' } 
    });
  }

  /**
   * Navigate to job detail khi click vào job title
   */
  onJobTitleClick(job: SavedJobDto) {
    this.router.navigate(['/candidate/job-detail', job.jobId]);
  }

  onUnsaveJob(job: SavedJobDto) {
    // Logic giống hệt như ở job detail
    this.jobApi.unsaveJob(job.jobId).subscribe({
      next: () => {
        // Remove from list
        this.savedJobs = this.savedJobs.filter(j => j.jobId !== job.jobId);
        this.totalCount--;
        this.showToastMessage('Đã bỏ lưu công việc thành công', 'success');
      },
      error: (error) => {
        console.error('Error unsaving job:', error);
        this.showToastMessage('Không thể bỏ lưu công việc', 'error');
      }
    });
  }

  trackByJobId(index: number, job: SavedJobDto): string {
    return job.jobId;
  }

  /**
   * Format saved date - Backend trả về UTC, convert sang múi giờ Việt Nam (UTC+7)
   */
  formatSavedDate(savedAt: Date | string): string {
    if (!savedAt) return '';
    
    try {
      // Parse date
      let date: Date;
      if (typeof savedAt === 'string') {
        // Nếu string có 'Z' (UTC), parse và giữ nguyên UTC
        // Nếu không có timezone, assume là UTC
        const dateStr = savedAt.includes('T') && !savedAt.includes('+') && !savedAt.includes('Z') 
          ? savedAt + 'Z' 
          : savedAt;
        date = new Date(dateStr);
      } else {
        date = new Date(savedAt);
      }
      
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', savedAt);
        return '';
      }
      
      // Debug log
      console.log('Original date:', savedAt, '→ Parsed UTC:', date.toISOString(), '→ Local:', date.toString());
      
      // Lấy UTC components
      const utcYear = date.getUTCFullYear();
      const utcMonth = date.getUTCMonth();
      const utcDate = date.getUTCDate();
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      
      // Cộng thêm 7 giờ cho múi giờ Việt Nam
      let vnHours = utcHours + 7;
      let vnDate = utcDate;
      let vnMonth = utcMonth;
      let vnYear = utcYear;
      
      // Xử lý overflow (nếu > 24h, chuyển sang ngày hôm sau)
      if (vnHours >= 24) {
        vnHours -= 24;
        vnDate++;
        // Xử lý tháng/năm overflow nếu cần
        const daysInMonth = new Date(vnYear, vnMonth + 1, 0).getDate();
        if (vnDate > daysInMonth) {
          vnDate = 1;
          vnMonth++;
          if (vnMonth > 11) {
            vnMonth = 0;
            vnYear++;
          }
        }
      }
      
      // Format
      const day = String(vnDate).padStart(2, '0');
      const month = String(vnMonth + 1).padStart(2, '0');
      const year = vnYear;
      const hours = String(vnHours).padStart(2, '0');
      const minutes = String(utcMinutes).padStart(2, '0');
      
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error, savedAt);
      return '';
    }
  }

  /**
   * Get company logo text (first 2-3 words) cho placeholder
   */
  getCompanyLogoText(companyName: string): string {
    if (!companyName) return 'SM';
    const words = companyName.trim().split(/\s+/);
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
    }
    return companyName.substring(0, 2).toUpperCase();
  }

  /**
   * Get province name from jobDetail hoặc location
   */
  getProvinceName(job: SavedJobDto): string {
    return job.jobDetail?.provinceName || job.location || 'N/A';
  }

  onBrowseJobs() {
    this.router.navigate(['/candidate/job']);
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose() {
    this.showToast = false;
  }
}

