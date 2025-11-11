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
        Validators.minLength(8),
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

      // Gọi API ResetPassword
      this.authService.resetPassword(input).subscribe({
        next: () => {
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
          this.isLoading = false;
          console.error('Reset password error:', error);
          
          // Xử lý lỗi
          if (error.error?.error?.message) {
            this.showToastMessage(error.error.error.message, 'error');
          } else if (error.error?.error) {
            const errorMessage = error.error.error;
            if (typeof errorMessage === 'string') {
              this.showToastMessage(errorMessage, 'error');
            } else if (errorMessage.details) {
              this.showToastMessage(errorMessage.details, 'error');
            } else {
              this.showToastMessage('Có lỗi xảy ra khi đặt lại mật khẩu.', 'error');
            }
          } else {
            this.showToastMessage('Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.', 'error');
          }
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
