import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';

@Component({
  selector: 'app-recruiter-register',
  standalone: true,
  templateUrl: './recruiter-register.html',
  styleUrls: ['./recruiter-register.scss'],
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class RecruiterRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private googleAuthService = inject(GoogleAuthService);

  registerForm!: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  ngOnInit(): void {
    this.initializeForm();
    this.googleAuthService.initialize();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(25)]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      city: ['', [Validators.required]],
      district: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !this.submitAttempted) return '';

    const errors = field.errors;

    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} là bắt buộc`;
    }

    if (errors['email']) {
      return 'Email không hợp lệ';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} phải có ít nhất ${requiredLength} ký tự`;
    }

    if (errors['pattern']) {
      return `${this.getFieldLabel(fieldName)} không đúng định dạng`;
    }

    if (errors['passwordMismatch']) {
      return 'Mật khẩu xác nhận không khớp';
    }

    if (errors['requiredTrue']) {
      return 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      fullName: 'Họ và tên',
      gender: 'Giới tính',
      phone: 'Số điện thoại cá nhân',
      companyName: 'Công ty',
      city: 'Tỉnh/thành phố',
      district: 'Quận/huyện',
      agreeTerms: 'Đồng ý điều khoản'
    };
    return labels[fieldName] || fieldName;
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitAttempted));
  }

  onSubmit() {
    this.submitAttempted = true;
    
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.valid) {
      this.isLoading = true;
      const formData = this.registerForm.value;
      
      const { confirmPassword, ...apiData } = formData;
      
      const registerDto = {
        userName: apiData.username,
        emailAddress: apiData.email,
        password: apiData.password,
        appName: 'VCareer'
      };
      
      this.http.post('/api/account/register', registerDto).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showToastMessage('Đăng ký thành công! Đang chuyển hướng...', 'success');
          setTimeout(() => {
            this.router.navigate(['/recruiter/dashboard']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.showToastMessage(error.error?.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        }
      });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  goToLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      
      // Sign up with Google
      const user = await this.googleAuthService.signInWithGoogle();
      
      console.log('Google user:', user);
      
      this.isLoading = false;
      this.showToastMessage('Đăng ký bằng Google thành công!', 'success');
      
      setTimeout(() => {
        this.router.navigate(['/recruiter/dashboard']);
      }, 2000);
      
    } catch (error) {
      console.error('Google sign up error:', error);
      this.isLoading = false;
      this.showToastMessage('Đăng ký bằng Google thất bại. Vui lòng thử lại.', 'error');
    }
  }

  goToSelector() {
    this.router.navigate(['/auth/selector']);
  }
}
