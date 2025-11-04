import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './saved-jobs.html',
  styleUrls: ['./saved-jobs.scss']
})
export class SavedJobsComponent implements OnInit {
  savedJobs: any[] = [];
  loading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  constructor(
    private router: Router,
    private translationService: TranslationService
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
    // TODO: Load from API
    // Mock data for now
    setTimeout(() => {
      this.savedJobs = [
        {
          id: 1,
          title: 'Giảng Viên Đào Tạo Lập Trình - Từ 1 Năm Kinh Nghiệm',
          companyName: 'CÔNG TY CỔ PHẦN RIKKEI EDUCATION',
          companyLogo: 'RIKKEI Academy',
          companyTagline: 'where the dream begins',
          salary: '15 - 25 triệu',
          location: 'Hà Nội',
          updatedTime: '11 phút trước',
          savedDate: '04/11/2025 - 22:27',
          logoBackground: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
        }
      ];
      this.loading = false;
    }, 500);
  }

  onApplyJob(job: any) {
    this.router.navigate(['/candidate/job-detail'], { 
      queryParams: { id: job.id, openApplyModal: 'true' } 
    });
  }

  onUnsaveJob(job: any) {
    // Remove from saved jobs
    this.savedJobs = this.savedJobs.filter(j => j.id !== job.id);
    this.showToastMessage(this.translate('saved_jobs.unsave_success'), 'success');
  }

  trackByJobId(index: number, job: any): any {
    return job.id;
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

