import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import { ChangePasswordDto, ProfileDto } from '../../../../proxy/profile/models';
import { EnableJobSearchModalComponent } from '../../../../shared/components/enable-job-search-modal/enable-job-search-modal';

@Component({
  selector: 'app-change-password',
  standalone: true,
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.scss'],
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent,
    EnableJobSearchModalComponent
  ]
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  isLoading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  currentUserEmail = '';
  
  // User profile data for sidebar
  userFullName: string = '';
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;
  showEnableJobSearchModal: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private profileService: ProfileService
  ) {
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadCurrentUserEmail();
  }

  loadCurrentUserEmail(): void {
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile: ProfileDto) => {
        this.currentUserEmail = profile.email || '';
        // Load user full name for sidebar
        const name = profile.name || '';
        const surname = profile.surname || '';
        this.userFullName = `${name} ${surname}`.trim() || 'User';
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // Use default data if API fails
        this.currentUserEmail = 'duyuong0273@gmail.com';
        this.userFullName = 'User';
      }
    });
  }

  // Validator cho độ mạnh mật khẩu
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;
    
    return passwordValid ? null : { passwordStrength: true };
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.hasError('passwordMismatch') && newPassword && confirmPassword.value === newPassword.value) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      // Check if new password is different from current password
      const currentPassword = this.changePasswordForm.get('currentPassword')?.value;
      const newPassword = this.changePasswordForm.get('newPassword')?.value;
      
      if (currentPassword === newPassword) {
        this.showToastMessage('Mật khẩu mới phải khác mật khẩu hiện tại', 'error');
        return;
      }

      this.isLoading = true;

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: this.changePasswordForm.get('confirmPassword')?.value
      };

      this.profileService.changePassword(changePasswordDto).subscribe({
        next: () => {
          this.isLoading = false;
          this.showToastMessage('Đổi mật khẩu thành công!', 'success');
          
          // Reset form after successful change
          setTimeout(() => {
            this.changePasswordForm.reset();
            // Optionally navigate back to profile or home
            // this.router.navigate(['/candidate/profile']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
          
          if (error.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
          
          this.showToastMessage(errorMessage, 'error');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
    }
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Tự động ẩn sau 4 giây
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  getFieldError(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} phải có ít nhất 8 ký tự`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} không được vượt quá 100 ký tự`;
      }
      if (field.errors['passwordStrength']) {
        return 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';
      }
      if (field.errors['passwordMismatch']) {
        return 'Mật khẩu xác nhận không khớp';
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      currentPassword: 'Mật khẩu hiện tại',
      newPassword: 'Mật khẩu mới',
      confirmPassword: 'Xác nhận mật khẩu mới'
    };
    return labels[fieldName] || fieldName;
  }

  navigateBack(): void {
    this.router.navigate(['/candidate/profile']);
  }

  // Enable Job Search Modal methods
  onToggleJobSearch() {
    if (this.jobSearchEnabled) {
      this.jobSearchEnabled = false;
    } else {
      this.showEnableJobSearchModal = true;
    }
  }

  onCloseEnableJobSearchModal() {
    this.showEnableJobSearchModal = false;
  }

  onEnableJobSearch(selectedCvIds: string[]) {
    console.log('Enable job search for CVs:', selectedCvIds);
    this.jobSearchEnabled = true;
    this.showToastMessage('Đã bật tìm việc thành công!', 'success');
  }
}

