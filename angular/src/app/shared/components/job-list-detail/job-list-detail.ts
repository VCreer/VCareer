import { Component, Input, Output, EventEmitter, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { LoginModalComponent } from '../login-modal/login-modal';
import { ExperienceLevel } from '../../../proxy/constants/job-constant/experience-level.enum';
import { JobSearchService } from '../../../proxy/services/job/job-search.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-job-list-detail',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent, LoginModalComponent],
  templateUrl: './job-list-detail.html',
  styleUrls: ['./job-list-detail.scss']
})
export class JobListDetailComponent implements OnChanges {
  @Input() selectedJob: any = null;
  @Input() provinces: any[] = []; // Provinces để lookup province name
  @Output() closeDetail = new EventEmitter<void>();
  @Output() viewDetail = new EventEmitter<any>();
  @Output() applyJob = new EventEmitter<any>();
  @Output() saveStatusChange = new EventEmitter<{ jobId: string; isSaved: boolean }>();

  private translationService = inject(TranslationService);
  isHeartActive: boolean = false;
  private previousJobId: number | null = null;
  isAuthenticated = false;
  showLoginModal = false;
  
  // Toast notification properties
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private jobSearchService: JobSearchService,
    private navigationService: NavigationService,
  ) {
    this.navigationService.isLoggedIn$.subscribe(isLogged => {
      this.isAuthenticated = isLogged;
    });
  }

  ngOnChanges() {
    // Khi đổi job trong quick view, đồng bộ lại trạng thái đã lưu từ backend
    if (this.selectedJob && this.selectedJob.id !== this.previousJobId) {
      this.previousJobId = this.selectedJob.id;
      this.syncSavedStatus();
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose() {
    this.closeDetail.emit();
  }

  onViewDetail() {
    this.viewDetail.emit(this.selectedJob);
  }

  onApply() {
    this.applyJob.emit(this.selectedJob);
  }

  onToggleHeart() {
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      return;
    }

    const jobId = this.selectedJob?.id;
    if (!jobId) {
      return;
    }

    if (this.isHeartActive) {
      this.jobSearchService.unsaveJob(jobId, { skipHandleError: true }).subscribe({
        next: () => {
          this.isHeartActive = false;
          this.showToastMessage(this.translate('job_detail.unsave_success') || 'Đã bỏ lưu công việc', 'success');
          this.saveStatusChange.emit({ jobId, isSaved: false });
        },
        error: () => {
          this.showToastMessage('Không thể bỏ lưu công việc', 'error');
        }
      });
    } else {
      this.jobSearchService.saveJob(jobId, { skipHandleError: true }).subscribe({
        next: () => {
          this.isHeartActive = true;
          this.showToastMessage(this.translate('job_detail.save_success') || 'Đã lưu công việc', 'success');
          this.saveStatusChange.emit({ jobId, isSaved: true });
        },
        error: () => {
          this.showToastMessage('Không thể lưu công việc', 'error');
        }
      });
    }
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  onToastClose() {
    this.showToast = false;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  onLoginSuccess() {
    this.showLoginModal = false;
    this.isAuthenticated = true;
    this.syncSavedStatus();
  }

  /**
   * Đồng bộ trạng thái đã lưu của job hiện tại từ backend
   */
  private syncSavedStatus() {
    if (!this.isAuthenticated || !this.selectedJob?.id) {
      this.isHeartActive = false;
      return;
    }

    this.jobSearchService.getSavedJobStatus(this.selectedJob.id, { skipHandleError: true }).subscribe({
      next: status => {
        this.isHeartActive = status.isSaved;
      },
      error: () => {
        this.isHeartActive = false;
      }
    });
  }

  formatSalary(job: any): string {
    if (job.salaryDeal) {
      return 'Thỏa thuận';
    }
    if (job.salaryMin && job.salaryMax) {
      return `${this.formatNumber(job.salaryMin)} - ${this.formatNumber(job.salaryMax)} VNĐ`;
    }
    if (job.salaryMin) {
      return `Từ ${this.formatNumber(job.salaryMin)} VNĐ`;
    }
    return 'Chưa cập nhật';
  }

  formatNumber(num: number): string {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('vi-VN');
  }

  formatExperience(level: any): string {
    if (level === undefined || level === null) return 'Không yêu cầu';
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

  getLocationText(job: any): string {
    // Nếu có wardName và provinceName từ BE, dùng luôn
    if (job.wardName && job.provinceName) {
      return `${job.wardName}, ${job.provinceName}`;
    }
    if (job.provinceName) {
      return job.provinceName;
    }
    
    // Nếu chỉ có provinceCode, lookup từ provinces array
    if (job.provinceCode && this.provinces && this.provinces.length > 0) {
      const province = this.provinces.find((p: any) => p.code === job.provinceCode);
      if (province) {
        // Nếu có wardCode, tìm ward name
        if (job.wardCode && province.wards && province.wards.length > 0) {
          const ward = province.wards.find((w: any) => w.code === job.wardCode);
          if (ward) {
            return `${ward.name}, ${province.name}`;
          }
        }
        return province.name;
      }
    }
    
    // Fallback: hiển thị mã nếu không tìm thấy
    if (job.provinceCode) {
      return `Mã: ${job.provinceCode}`;
    }
    
    return 'Chưa cập nhật';
  }

  formatText(text: string): string {
    if (!text) return '';
    // Convert newlines to <br> tags
    return text.replace(/\n/g, '<br>');
  }
}
