import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../core/services/navigation.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { finalize } from 'rxjs/operators';
import {AuthFacadeService} from '../../../../core/services/auth-Cookiebased/auth-facade.service';




@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './candidate-login.html',
  styleUrls: ['./candidate-login.scss'],
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class LoginComponent {
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacadeService);
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
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.googleAuthService.initialize();
  }

  emailOrUsernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    if (emailRegex.test(value) || usernameRegex.test(value)) {
      return null;
    }

    return { invalidFormat: true };
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || (!field.touched && !this.submitAttempted)) return '';

    const errors = field.errors;

    if (errors['required']) {
      return fieldName === 'username' ? 'Tên đăng nhập hoặc email là bắt buộc' : 'Mật khẩu là bắt buộc';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      if (fieldName === 'username') {
        return `Tên đăng nhập phải có ít nhất ${requiredLength} ký tự`;
      } else {
        return `Mật khẩu phải có ít nhất ${requiredLength} ký tự`;
      }
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      if (fieldName === 'username') {
        return `Tên đăng nhập không được quá ${requiredLength} ký tự`;
      } else {
        return `Mật khẩu không được quá ${requiredLength} ký tự`;
      }
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

    Object.keys(this.loginForm.controls).forEach(k =>
      this.loginForm.get(k)?.markAsTouched()
    );

    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    const payload = { email: username, password };

    this.authFacade.loginCandidate(payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          // Lưu trạng thái đăng nhập vào navigation service
          this.navigationService.loginAsCandidate();
          this.showToastMessage('Đăng nhập thành công!', 'success');
          setTimeout(() => this.router.navigate(['/']), 800);
        },
        error: (err) => {
          console.error('Candidate login error:', err);
          console.error('Error details:', {
            status: err?.status,
            statusText: err?.statusText,
            error: err?.error,
            message: err?.message,
            url: err?.url
          });
          
          let msg = 'Đăng nhập thất bại. Vui lòng thử lại.';
          
          if (err?.error?.message) {
            msg = err.error.message;
          } else if (err?.error?.error_description) {
            msg = err.error.error_description;
          } else if (err?.error?.error) {
            msg = typeof err.error.error === 'string' ? err.error.error : 'Đăng nhập thất bại. Vui lòng thử lại.';
          } else if (err?.message) {
            msg = err.message;
          } else if (err?.status === 0) {
            msg = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          } else if (err?.status === 401) {
            msg = 'Email hoặc mật khẩu không đúng.';
          } else if (err?.status === 404) {
            msg = 'Tài khoản không tồn tại.';
          } else if (err?.status === 500) {
            msg = 'Lỗi server. Vui lòng thử lại sau.';
          }
          
          this.showToastMessage(msg, 'error');
        }
      });
  }



  navigateToSignUp() {
    this.router.navigate(['/candidate/register']);
  }

  forgotPassword() {
    this.router.navigate(['/candidate/forget-password']);
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      console.log('Starting Google sign in...');
      
      // Sign in with Google to get idToken
      const googleUser = await this.googleAuthService.signInWithGoogle();
      console.log('Google user received:', { 
        id: googleUser.id, 
        email: googleUser.email, 
        name: googleUser.name,
        hasIdToken: !!googleUser.idToken 
      });
      
      if (!googleUser.idToken) {
        console.error('No idToken received from Google');
        throw new Error('Không thể lấy token từ Google. Vui lòng thử lại.');
      }

      console.log('Calling backend API with idToken...');
      // Call backend API with Google idToken
      this.authFacade.loginWithGoogle({ idToken: googleUser.idToken })
        .pipe(finalize(() => {
          this.isLoading = false;
          console.log('Google login request completed');
        }))
        .subscribe({
          next: () => {
            console.log('Google login successful');
            this.showToastMessage('Đăng nhập bằng Google thành công!', 'success');
            this.navigationService.loginAsCandidate();
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 800);
          },
          error: (err) => {
            console.error('Google login API error:', err);
            console.error('Error details:', {
              status: err?.status,
              statusText: err?.statusText,
              error: err?.error,
              message: err?.message,
              url: err?.url
            });
            
            let msg = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
            
            if (err?.error?.message) {
              msg = err.error.message;
            } else if (err?.error?.error_description) {
              msg = err.error.error_description;
            } else if (err?.error?.error) {
              msg = err.error.error;
            } else if (err?.message) {
              msg = err.message;
            } else if (err?.status === 0) {
              msg = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            } else if (err?.status === 401) {
              msg = 'Xác thực Google thất bại. Vui lòng thử lại.';
            } else if (err?.status === 500) {
              msg = 'Lỗi server. Vui lòng thử lại sau.';
            }
            
            this.showToastMessage(msg, 'error');
          }
        });
      
    } catch (error: any) {
      console.error('Google sign in error:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      this.isLoading = false;
      
      let errorMsg = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
      
      if (error?.message) {
        errorMsg = error.message;
      } else if (error?.error) {
        errorMsg = error.error;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      // Xử lý các lỗi phổ biến của Google OAuth
      if (errorMsg.includes('popup_closed_by_user') || errorMsg.includes('popup closed')) {
        errorMsg = 'Bạn đã đóng cửa sổ đăng nhập Google. Vui lòng thử lại.';
      } else if (errorMsg.includes('access_denied')) {
        errorMsg = 'Bạn đã từ chối quyền truy cập Google. Vui lòng thử lại và cấp quyền.';
      } else if (errorMsg.includes('idpiframe_initialization_failed')) {
        errorMsg = 'Không thể khởi tạo Google OAuth. Vui lòng kiểm tra kết nối mạng và thử lại.';
      }
      
      this.showToastMessage(errorMsg, 'error');
    }
  }
}
