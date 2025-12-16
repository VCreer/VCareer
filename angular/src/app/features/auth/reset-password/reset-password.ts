import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../shared/components';
import { AuthService } from '../../../proxy/services/auth/auth.service';
import { ResetPasswordDto } from '../../../proxy/dto/auth-dto/models';
import { catchError, of, EMPTY } from 'rxjs';

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
  token = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Lấy email và token từ query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';
      
      // Nếu không có email hoặc token, chuyển đến trang login
      if (!this.email || !this.token) {
        this.showToastMessage('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'error');
        setTimeout(() => {
          this.navigateToLogin();
        }, 2000);
      }
    });
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
      // Kiểm tra email và token
      if (!this.email || !this.token) {
        this.showToastMessage('Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu link mới.', 'error');
        return;
      }

      this.isLoading = true;

      const formData = this.resetPasswordForm.value;

      const input: ResetPasswordDto = {
        email: this.email,
        token: this.token,
        newPassword: formData.password
      };

      // Kiểm tra route để gọi API phù hợp
      const currentUrl = this.router.url;
      const isCandidateRoute = currentUrl.includes('/candidate/');
      const isRecruiterRoute = currentUrl.includes('/recruiter/');
      
      // Gọi API ResetPassword phù hợp với role
      let apiCall;
      if (isCandidateRoute) {
        apiCall = this.authService.candidateResetPassword(input);
      } else if (isRecruiterRoute) {
        apiCall = this.authService.recruiterResetPassword(input);
      } else {
        apiCall = this.authService.resetPassword(input);
      }
      
      // Interceptor đã xử lý error và return success response với error data
      apiCall.subscribe({
        next: (result: any) => {
          // API trả về void khi thành công, nên result sẽ là undefined hoặc null
          // Nếu result là object, có thể là error response từ interceptor
          if (result != null && typeof result === 'object') {
            // Kiểm tra nếu response có _error flag (từ interceptor)
            const errorData = result?.body?._error === true ? result.body : 
                             result?._error === true ? result : null;
            
            if (errorData) {
              // Có error, đã được interceptor xử lý
              this.isLoading = false;
              this.handleResetPasswordError(errorData.error || result.body?.error || result.error);
              return;
            }
          }
          
          // Thành công (result là undefined hoặc null)
          this.isLoading = false;
          this.showToastMessage('Mật khẩu đã được đặt lại thành công!', 'success');
          
          // Xóa form và thông tin reset
          this.resetPasswordForm.reset();
          this.email = '';
          this.token = '';
          
          // Điều hướng đến trang đăng nhập sau 2 giây
          setTimeout(() => {
            this.navigateToLogin();
          }, 2000);
        },
        error: (error) => {
          // Fallback: nếu vẫn có error (không nên xảy ra)
          this.isLoading = false;
          this.handleResetPasswordError(error);
        }
      });
    } else {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
    }
  }

  navigateToLogin(): void {
    // Mặc định chuyển đến candidate login
    // Có thể cải thiện bằng cách detect từ email hoặc lưu context
    this.router.navigate(['/candidate/login']);
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Tự động ẩn sau 3 giây
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
        return `${this.getFieldLabel(fieldName)} phải có ít nhất 6 ký tự`;
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

  private handleResetPasswordError(error: any): void {
    this.isLoading = false;
    console.error('Reset password error:', error);
    
    // Xử lý lỗi và hiển thị toast tiếng Việt
    let errorMessage = 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.';
    
    // Kiểm tra các loại lỗi từ backend
    if (error?.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error?.error?.error?.details) {
      errorMessage = error.error.error.details;
    } else if (error?.error?.error) {
      const errorObj = error.error.error;
      if (typeof errorObj === 'string') {
        errorMessage = errorObj;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      } else if (errorObj.details) {
        errorMessage = errorObj.details;
      }
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      // Xử lý lỗi "An internal error occurred" từ ABP
      if (error.message.includes('internal error') || error.message.includes('Internal error')) {
        errorMessage = 'Token không khớp với email. Vui lòng sử dụng link đặt lại mật khẩu từ email của bạn.';
      } else {
        errorMessage = error.message;
      }
    } else if (error?.status === 500 || error?.status === 400) {
      errorMessage = 'Token không khớp với email. Vui lòng sử dụng link đặt lại mật khẩu từ email của bạn.';
    }
    
    // Xử lý lỗi "11" hoặc các error code khác
    if (error?.error?.error?.code) {
      const errorCode = error.error.error.code;
      if (errorCode === '11' || errorCode === 11) {
        errorMessage = 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.';
      }
    }
    
    // Hiển thị toast thay vì modal
    this.showToastMessage(errorMessage, 'error');
  }

}
