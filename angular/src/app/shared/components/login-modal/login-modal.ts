import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomAuthService } from '../../../core/services/custom-auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
// Import trực tiếp để tránh circular dependency
import { InputFieldComponent } from '../input-field/input-field';
import { PasswordFieldComponent } from '../password-field/password-field';
import { ButtonComponent } from '../button/button';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { finalize } from 'rxjs/operators';
import { AuthService as ProxyAuthService } from '../../../proxy/services/auth/auth.service';
import { TokenResponseDto } from '../../../proxy/dto/jwt-dto/models';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './login-modal.html',
  styleUrls: ['./login-modal.scss']
})
export class LoginModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  private customAuthService = inject(CustomAuthService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private proxyAuth = inject(ProxyAuthService);
  private googleAuthService = inject(GoogleAuthService);

  loginForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        this.emailOrUsernameValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      rememberMe: [false]
    });
  }

  emailOrUsernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Username pattern: chỉ chữ, số, gạch ngang, gạch dưới
    const usernamePattern = /^[a-zA-Z0-9_-]+$/;

    if (emailPattern.test(value) || usernamePattern.test(value)) {
      return null;
    }

    return { invalidFormat: true };
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || (!field.touched && !this.submitAttempted)) {
      return '';
    }

    const errors = field.errors;
    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return `${fieldName === 'username' ? 'Tên đăng nhập hoặc Email' : 'Mật khẩu'} là bắt buộc`;
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      if (fieldName === 'username') {
        return `Tên đăng nhập phải có ít nhất ${requiredLength} ký tự`;
      }
      return `Mật khẩu phải có ít nhất ${requiredLength} ký tự`;
    }

    if (errors['maxlength']) {
      return `Tên đăng nhập không được vượt quá ${errors['maxlength'].requiredLength} ký tự`;
    }

    if (errors['invalidFormat']) {
      return 'Vui lòng nhập email hợp lệ hoặc tên đăng nhập (chỉ chữ, số, gạch ngang, gạch dưới)';
    }

    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitAttempted));
  }

  onSubmit() {
    this.submitAttempted = true;

    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (!this.loginForm.valid) {
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
    const { username, password } = this.loginForm.value;

    const payload = {
      email: username,
      password: password,
    };

    this.proxyAuth
      .login(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (result: TokenResponseDto | any) => {
          // Một số backend có thể trả về accessToken hoặc access_token
          const accessToken = (result as any)?.accessToken || (result as any)?.access_token;
          const refreshToken = (result as any)?.refreshToken || (result as any)?.refresh_token;
          if (!accessToken || typeof accessToken !== 'string') {
            this.showToastMessage('Server không trả về token hợp lệ.', 'error');
            return;
          }

          // Lưu token vào cả localStorage và sessionStorage (dự phòng)
          try {
            localStorage.setItem('access_token', accessToken);
            if (refreshToken) {
              localStorage.setItem('refresh_token', refreshToken);
            }
          } catch {}

          try {
            sessionStorage.setItem('access_token', accessToken);
            if (refreshToken) {
              sessionStorage.setItem('refresh_token', refreshToken);
            }
          } catch {}

          this.showToastMessage('Đăng nhập thành công!', 'success');
          this.navigationService.loginAsCandidate();
          
          // Emit success để FE đóng modal và cập nhật trạng thái
          this.loginSuccess.emit();
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.error_description ||
            err?.error?.error ||
            'Đăng nhập thất bại. Vui lòng thử lại.';
          this.showToastMessage(msg, 'error');
        },
      });
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      
      const user = await this.googleAuthService.signInWithGoogle();
      
      this.isLoading = false;
      this.showToastMessage('Đăng nhập bằng Google thành công!', 'success');
      this.navigationService.loginAsCandidate();
      
      // Emit success để FE đóng modal và cập nhật trạng thái
      this.loginSuccess.emit();
      
    } catch (error) {
      console.error('Google sign in error:', error);
      this.isLoading = false;
      this.showToastMessage('Đăng nhập bằng Google thất bại. Vui lòng thử lại.', 'error');
    }
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  closeModal() {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}

