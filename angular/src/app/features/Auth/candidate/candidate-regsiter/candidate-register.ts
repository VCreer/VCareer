import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomAuthService } from '../../../../core/services/custom-auth.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { AuthService as ProxyAuthService } from '../../../../proxy/services/auth/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './candidate-register.html',
  styleUrls: ['./candidate-register.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private customAuthService = inject(CustomAuthService);
  private googleAuthService = inject(GoogleAuthService);
  private proxyAuth = inject(ProxyAuthService);
  private navigationService = inject(NavigationService);
  private authFacade = inject(AuthFacadeService);

  registerForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.nameValidator
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.nameValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(255)
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        this.usernameValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      termsAgreement: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.googleAuthService.initialize();
  }

  nameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const nameRegex = /^[a-zA-ZÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐđ\s]+$/;
    return nameRegex.test(value) ? null : { invalidName: true };
  }

  usernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(value) ? null : { invalidUsername: true };
  }

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

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
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
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} là bắt buộc`;
    if (errors['email']) return 'Email không hợp lệ';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} phải có ít nhất ${errors['minlength'].requiredLength} ký tự`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} không được vượt quá ${errors['maxlength'].requiredLength} ký tự`;
    if (errors['invalidName']) return 'Tên chỉ được chứa chữ cái và khoảng trắng';
    if (errors['invalidUsername']) return 'Tên đăng nhập chỉ được chứa chữ cái, số, gạch ngang và gạch dưới';
    if (errors['passwordStrength']) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';
    if (errors['passwordMismatch']) return 'Mật khẩu xác nhận không khớp';
    if (errors['requiredTrue']) return 'Bạn phải đồng ý với điều khoản dịch vụ và chính sách bảo mật';

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'firstName': 'Họ',
      'lastName': 'Tên',
      'email': 'Email',
      'username': 'Tên đăng nhập',
      'password': 'Mật khẩu',
      'confirmPassword': 'Xác nhận mật khẩu',
      'termsAgreement': 'Điều khoản'
    };
    return labels[fieldName] || fieldName;
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

  if (this.registerForm.invalid) {
    const firstErrorField = Object.keys(this.registerForm.controls).find(key =>
      this.registerForm.get(key)?.invalid
    );
    if (firstErrorField) {
      const element = document.querySelector(`[formControlName="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  this.isLoading = true;

  // Ghép name = firstName + lastName
  const { firstName, lastName, email, password } = this.registerForm.value;
  const input = {
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: email.trim(),
    password: password
  };

  this.proxyAuth.candidateRegister(input)
    .subscribe({
      next: () => {
        this.isLoading = false;
        this.showToastMessage('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...', 'success');
        setTimeout(() => this.router.navigate(['/candidate/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        this.showToastMessage(msg, 'error');
      }
    });
}


  navigateToLogin() {
    this.router.navigate(['/candidate/login']);
  }

  async signUpWithGoogle() {
    try {
      this.isLoading = true;
      console.log('Starting Google sign up...');
      
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
      // Call backend API with Google idToken (backend will auto-register if user doesn't exist)
      this.authFacade.loginWithGoogle({ idToken: googleUser.idToken })
        .pipe(finalize(() => {
          this.isLoading = false;
          console.log('Google sign up request completed');
        }))
        .subscribe({
          next: () => {
            console.log('Google sign up successful');
            this.showToastMessage('Đăng ký bằng Google thành công!', 'success');
            this.navigationService.loginAsCandidate();
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 800);
          },
          error: (err) => {
            console.error('Google sign up API error:', err);
            console.error('Error details:', {
              status: err?.status,
              statusText: err?.statusText,
              error: err?.error,
              message: err?.message,
              url: err?.url
            });
            
            let msg = 'Đăng ký bằng Google thất bại. Vui lòng thử lại.';
            
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
      console.error('Google sign up error:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      this.isLoading = false;
      
      let errorMsg = 'Đăng ký bằng Google thất bại. Vui lòng thử lại.';
      
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
