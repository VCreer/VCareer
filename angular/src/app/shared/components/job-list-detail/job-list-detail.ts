import { Component, Input, Output, EventEmitter, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { ExperienceLevel } from '../../../proxy/constants/job-constant/experience-level.enum';

@Component({
  selector: 'app-job-list-detail',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  templateUrl: './job-list-detail.html',
  styleUrls: ['./job-list-detail.scss']
})
export class JobListDetailComponent implements OnChanges {
  @Input() selectedJob: any = null;
  @Input() provinces: any[] = []; // Provinces để lookup province name
  @Output() closeDetail = new EventEmitter<void>();
  @Output() viewDetail = new EventEmitter<any>();
  @Output() applyJob = new EventEmitter<any>();

  private translationService = inject(TranslationService);
  isHeartActive: boolean = false;
  private previousJobId: number | null = null;
  
  // Toast notification properties
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  ngOnChanges() {
    // Reset heart state when switching to a different job
    if (this.selectedJob && this.selectedJob.id !== this.previousJobId) {
      this.isHeartActive = false;
      this.previousJobId = this.selectedJob.id;
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
    this.isHeartActive = !this.isHeartActive;
    if (this.isHeartActive) {
      this.showToastMessage(this.translate('job_detail.save_success'), 'success');
    } else {
      this.showToastMessage(this.translate('job_detail.unsave_success'), 'success');
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
