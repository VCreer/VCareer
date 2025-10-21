import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification.component';

@Component({
  selector: 'app-download-cv-modal',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  templateUrl: './download-cv-modal.html',
  styleUrl: './download-cv-modal.scss'
})
export class DownloadCvModal {
  @Output() close = new EventEmitter<void>();
  @Output() downloadWithoutLogo = new EventEmitter<void>();
  @Output() downloadFree = new EventEmitter<void>();

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose() {
    this.close.emit();
  }

  onDownloadWithoutLogo() {
    this.downloadWithoutLogo.emit();
    this.showSuccessToast('download_cv.success_without_logo');
    console.log('Download CV without logo');
  }

  onDownloadFree() {
    this.downloadFree.emit();
    this.showSuccessToast('download_cv.success_free');
    console.log('Download CV free');
  }

  showSuccessToast(messageKey: string) {
    this.toastMessage = this.translate(messageKey);
    this.toastType = 'success';
    this.showToast = true;
  }

  onToastClose() {
    this.showToast = false;
  }
}
