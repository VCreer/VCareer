import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomAuthService } from '../../../../core/services/custom-auth.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { AuthService as ProxyAuthService } from '../../../../proxy/services/auth/auth.service';
import { TeamManagementService } from '../../../../proxy/services/team-management';

@Component({
  selector: 'app-recruiter-login',
  standalone: true,
  templateUrl: './recruiter-login.html',
  styleUrls: ['./recruiter-login.scss'],
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class RecruiterLoginComponent {
  private customAuthService = inject(CustomAuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private navigationService = inject(NavigationService);
  private proxyAuth = inject(ProxyAuthService);
  private teamManagementService = inject(TeamManagementService);

  loginForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(255)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      rememberMe: [false]
    });
  }

  emailValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : { invalidEmail: true };
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;

    if (errors['required']) {
      return fieldName === 'email' ? 'Email công ty là bắt buộc' : 'Mật khẩu là bắt buộc';
    }

    if (errors['email']) {
      return 'Email công ty không hợp lệ';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `Mật khẩu phải có ít nhất ${requiredLength} ký tự`;
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return fieldName === 'email' 
        ? `Email không được quá ${requiredLength} ký tự`
        : `Mật khẩu không được quá ${requiredLength} ký tự`;
    }

    if (errors['invalidEmail']) {
      return 'Email công ty không hợp lệ';
    }

    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitAttempted));
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onSubmit() {
  this.submitAttempted = true;

  Object.keys(this.loginForm.controls).forEach(key => {
    this.loginForm.get(key)?.markAsTouched();
  });

  if (this.loginForm.invalid) {
    const firstErrorField = Object.keys(this.loginForm.controls).find(key =>
      this.loginForm.get(key)?.invalid
    );
    if (firstErrorField) {
      const element = document.querySelector(`[formControlName="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  this.isLoading = true;
  const { email, password } = this.loginForm.value;

  const input = { email, password };

  this.proxyAuth.recruiterLogin(input).subscribe({
    next: (res) => {
      this.isLoading = false;
      this.showToastMessage('Đăng nhập thành công!', 'success');

      // Lưu token (nếu trả về TokenResponseDto)
      if (res?.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('user_role', 'recruiter');
      }

      // Điều hướng - kiểm tra xem có phải HR Staff không
      setTimeout(() => {
        // Kiểm tra xem user có phải HR Staff (IsLead = false) không
        this.teamManagementService.getCurrentUserInfo().subscribe({
          next: (userInfo) => {
            // HR Staff là user có IsLead = false, không được redirect đến recruiter-verify
            if (!userInfo.isLead) {
              // HR Staff: redirect đến trang chủ recruiter, không qua verify
              this.navigationService.loginAsRecruiterWithoutVerify();
            } else {
              // Leader: sử dụng logic redirect bình thường (có thể redirect đến verify nếu chưa verify)
              this.navigationService.loginAsRecruiter();
            }
          },
          error: (error) => {
            console.error('Error loading user info after login:', error);
            // Nếu không lấy được thông tin, sử dụng logic redirect bình thường (fallback)
            this.navigationService.loginAsRecruiter();
          }
        });
      }, 1500);
    },
    error: (err) => {
      this.isLoading = false;

      let msg = 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (err?.status === 401) msg = 'Email hoặc mật khẩu không đúng.';
      else if (err?.status === 404) msg = 'Tài khoản không tồn tại.';
      else if (err?.error?.message) msg = err.error.message;

      this.showToastMessage(msg, 'error');
      this.loginForm.patchValue({ password: '' });
    }
  });
}


  navigateToSignUp() {
    this.router.navigate(['/recruiter/register']);
  }

  forgotPassword() {
    this.router.navigate(['/recruiter/forgot-password']);
  }

  signInWithGoogle() {
    console.log('Đăng nhập bằng Google');
  }

  goToSelector() {
    this.router.navigate(['/auth/selector']);
  }
}
