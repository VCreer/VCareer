import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-apply-job-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apply-job-modal.html',
  styleUrls: ['./apply-job-modal.scss']
})
export class ApplyJobModalComponent {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{cvOption: string, showToast: boolean, toastMessage: string}>();

  selectedCVOption: string = 'recent';
  uploadedFile: File | null = null;
  fullName: string = '';
  email: string = '';
  phone: string = '';
  
  // Validation errors
  fullNameError: string = '';
  emailError: string = '';
  phoneError: string = '';

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    // Validate form before submitting
    if (this.selectedCVOption === 'upload' && !this.validateForm()) {
      return;
    }
    
    // Close modal first
    this.onClose();
    
    // Emit submit event with toast info
    this.submit.emit({
      cvOption: this.selectedCVOption,
      showToast: true,
      toastMessage: this.translate('apply_modal.submit_success')
    });
  }

  validateForm(): boolean {
    let isValid = true;
    
    // Reset errors
    this.fullNameError = '';
    this.emailError = '';
    this.phoneError = '';
    
    // Validate full name
    if (!this.fullName.trim()) {
      this.fullNameError = this.translate('apply_modal.validation_full_name');
      isValid = false;
    }
    
    // Validate email
    if (!this.email.trim()) {
      this.emailError = this.translate('apply_modal.validation_email_required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = this.translate('apply_modal.validation_email_invalid');
      isValid = false;
    }
    
    // Validate phone
    if (!this.phone.trim()) {
      this.phoneError = this.translate('apply_modal.validation_phone_required');
      isValid = false;
    } else if (!/^[0-9]{10,11}$/.test(this.phone.replace(/[\s-]/g, ''))) {
      this.phoneError = this.translate('apply_modal.validation_phone_invalid');
      isValid = false;
    }
    
    return isValid;
  }
  
  onFieldChange(): void {
    // Clear errors when user starts typing
    if (this.fullName) this.fullNameError = '';
    if (this.email) this.emailError = '';
    if (this.phone) this.phoneError = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(this.translate('apply_modal.file_type_error'));
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert(this.translate('apply_modal.file_size_error'));
        return;
      }

      this.uploadedFile = file;
      this.selectedCVOption = 'upload';
    }
  }

  onUploadBtnClick(event: Event): void {
    event.preventDefault();
    const fileInput = document.getElementById('cv-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeFile(): void {
    this.uploadedFile = null;
  }
}
