import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../shared/components';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  email = '';
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' | 'error'

  constructor(
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.email = localStorage.getItem('reset_email') || '';
    if (!this.email) {
      // Redirect to appropriate login based on current route
      const currentUrl = this.router.url;
      if (currentUrl.includes('/recruiter/')) {
        this.router.navigate(['/recruiter/login']);
      } else {
        this.router.navigate(['/candidate/login']);
      }
    }
  }

  // Validator cho độ mạnh mật khẩu (giống candidate register)
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
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  // Password visibility is now handled by PasswordFieldComponent

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;

      const formData = this.resetPasswordForm.value;

      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        
        // Mock success - in real app, send to backend
        this.showToastMessage('Mật khẩu đã được đặt lại thành công!', 'success');
        
        // Clear form
        this.resetPasswordForm.reset();
        
        // Redirect to login immediately after 2 seconds
        setTimeout(() => {
          this.navigateToLogin();
        }, 2000);
      }, 2000);
    } else {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
    }
  }

  navigateToLogin(): void {
    const currentUrl = this.router.url;
    console.log('Current URL:', currentUrl);
    if (currentUrl.includes('/recruiter/')) {
      console.log('Navigating to recruiter login');
      this.router.navigate(['/recruiter/login']);
    } else {
      console.log('Navigating to candidate login');
      this.router.navigate(['/candidate/login']);
    }
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getFieldError(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
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
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu'
    };
    return labels[fieldName] || fieldName;
  }

}