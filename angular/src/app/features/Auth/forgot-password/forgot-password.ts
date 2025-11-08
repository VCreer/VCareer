import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  InputFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../shared/components';
import { AuthService } from '../../../proxy/services/auth/auth.service';
import { ForgotPasswordDto } from '../../../proxy/dto/auth-dto/models';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    RouterModule,
    InputFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;
      
      const input: ForgotPasswordDto = {
        email: email
      };

      // Gọi API ForgotPassword
      this.authService.forgotPassword(input).subscribe({
        next: () => {
          this.isLoading = false;
          this.showToastMessage('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.', 'success');
          
          // Reset form sau khi gửi thành công
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Forgot password error:', error);
          
          // Xử lý lỗi
          if (error.error?.error?.message) {
            this.showToastMessage(error.error.error.message, 'error');
          } else if (error.error?.error) {
            this.showToastMessage(error.error.error, 'error');
          } else {
            this.showToastMessage('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email'
    };
    return labels[fieldName] || fieldName;
  }

  navigateToLogin(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/recruiter/')) {
      this.router.navigate(['/recruiter/login']);
    } else {
      this.router.navigate(['/candidate/login']);
    }
  }

  navigateToRegister(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/recruiter/')) {
      this.router.navigate(['/recruiter/register']);
    } else {
      this.router.navigate(['/candidate/register']);
    }
  }

  // Reset form when error occurs
  resetForm(): void {
    this.forgotPasswordForm.reset();
    // Clear any previous messages
  }
}
