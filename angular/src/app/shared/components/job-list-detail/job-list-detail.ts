import { Component, Input, Output, EventEmitter, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';

@Component({
  selector: 'app-job-list-detail',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  templateUrl: './job-list-detail.html',
  styleUrls: ['./job-list-detail.scss']
})
export class JobListDetailComponent implements OnChanges {
  @Input() selectedJob: any = null;
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
}
