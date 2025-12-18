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
import { catchError, of, finalize, tap, EMPTY } from 'rxjs';

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
  isCandidateRoute = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    // Xác định route ngay từ đầu
    const currentUrl = this.router.url;
    this.isCandidateRoute = currentUrl.includes('/candidate/');
    console.log('Forgot Password Component - Current URL:', currentUrl);
    console.log('Forgot Password Component - Is Candidate Route:', this.isCandidateRoute);
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

      // Xác định route để gọi API phù hợp
      const currentUrl = this.router.url;
      const isCandidateRoute = currentUrl.includes('/candidate/');
      const isRecruiterRoute = currentUrl.includes('/recruiter/');
      
      // Gọi API ForgotPassword phù hợp với role
      let apiCall;
      if (isCandidateRoute) {
        apiCall = this.authService.candidateForgotPassword(input);
        console.log('Forgot Password - Calling API: candidateForgotPassword');
      } else if (isRecruiterRoute) {
        apiCall = this.authService.recruiterForgotPassword(input);
        console.log('Forgot Password - Calling API: recruiterForgotPassword');
      } else {
        apiCall = this.authService.forgotPassword(input);
        console.log('Forgot Password - Calling API: forgotPassword');
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
              this.handleForgotPasswordError(errorData.error || result.body?.error || result.error);
              return;
            }
          }
          
          // Thành công (result là undefined hoặc null)
          this.isLoading = false;
          this.showToastMessage('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.', 'success');
          
          // Reset form sau khi gửi thành công
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          // Fallback: nếu vẫn có error (không nên xảy ra)
          this.isLoading = false;
          this.handleForgotPasswordError(error);
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

  private handleForgotPasswordError(error: any): void {
    this.isLoading = false;
    console.error('Forgot password error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Xử lý lỗi - ưu tiên hiển thị message từ backend
    let errorMessage = 'Tài khoản không hợp lệ. Vui lòng kiểm tra lại email.';
    
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
        errorMessage = 'Tài khoản không hợp lệ. Vui lòng kiểm tra lại email.';
      } else {
        errorMessage = error.message;
      }
    } else if (error?.status === 500 || error?.status === 400) {
      errorMessage = 'Tài khoản không hợp lệ. Vui lòng kiểm tra lại email.';
    }
    
    // Hiển thị toast thay vì modal
    this.showToastMessage(errorMessage, 'error');
  }
}
