import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';

@Component({
  selector: 'app-upload-cv-modal',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  templateUrl: './upload-cv-modal.html',
  styleUrls: ['./upload-cv-modal.scss']
})
export class UploadCvModal {
  @Output() close = new EventEmitter<void>();
  @Output() uploadCv = new EventEmitter<File>();

  selectedFile: File | null = null;
  showToast = false;
  toastMessage = '';
  toastType = 'success';

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose() {
    this.close.emit();
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (this.validateFile(file)) {
        this.selectedFile = file;
        this.showSuccessToast(this.translate('upload_cv.file_selected_success'));
      }
    }
  }

  onUpload() {
    if (this.selectedFile) {
      this.uploadCv.emit(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.validateFile(file)) {
        this.selectedFile = file;
        this.showSuccessToast(this.translate('upload_cv.file_selected_success'));
      }
    }
  }

  validateFile(file: File): boolean {
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      this.showErrorToast(this.translate('upload_cv.invalid_file_type'));
      return false;
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showErrorToast(this.translate('upload_cv.file_too_large'));
      return false;
    }

    return true;
  }

  showSuccessToast(message: string) {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  showErrorToast(message: string) {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  onToastClose() {
    this.showToast = false;
  }
}
