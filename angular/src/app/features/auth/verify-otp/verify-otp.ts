import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../shared/components';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.scss'],
  imports: [
    CommonModule,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class VerifyOtpComponent implements OnInit {
  isLoading = false;
  isResending = false;
  email = '';
  otpValues: string[] = ['', '', '', '', '', ''];
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private router: Router
  ) {}

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

  onKeyDown(event: any, index: number): void {
    // Handle number input
    if (event.key >= '0' && event.key <= '9') {
      // Update the array directly
      this.otpValues[index] = event.key;
      
      // Clear any previous error messages
      this.showToast = false;
      
      // Auto focus next input
      if (index < 5) {
        setTimeout(() => {
          const allInputs = document.querySelectorAll('.otp-input');
          const nextInput = allInputs[index + 1] as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
          }
        }, 100);
      }
    }
    
    // Handle backspace
    if (event.key === 'Backspace') {
      if (this.otpValues[index]) {
        // If current field has value, clear it
        this.otpValues[index] = '';
        event.target.value = '';
      } else if (index > 0) {
        // If current field is empty, move to previous field and clear it
        const allInputs = document.querySelectorAll('.otp-input');
        const prevInput = allInputs[index - 1] as HTMLInputElement;
        if (prevInput) {
          this.otpValues[index - 1] = '';
          prevInput.value = '';
          prevInput.focus();
        }
      }
    }
  }

  onSubmit(): void {
    const otp = this.otpValues.join('');
    
    // Check if all 6 digits are filled
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      this.showToastMessage('Vui lòng nhập đầy đủ 6 chữ số', 'error');
      return;
    }
    
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      this.isLoading = true;
      
      // Simulate API call to verify OTP
      setTimeout(() => {
        this.isLoading = false;
        
        // Simulate OTP verification
        if (otp === '123456') {
          // OTP is correct
          this.showToastMessage('Xác thực thành công!', 'success');
          
          // Redirect to reset password page after 2 seconds
          setTimeout(() => {
            const currentUrl = this.router.url;
            if (currentUrl.includes('/recruiter/')) {
              this.router.navigate(['/recruiter/reset-password']);
            } else {
              this.router.navigate(['/candidate/reset-password']);
            }
          }, 2000);
        } else {
          // OTP is incorrect
          this.showToastMessage('Mã OTP không đúng. Vui lòng thử lại.', 'error');
        }
      }, 2000);
    }
  }

  resendOtp(): void {
    this.isResending = true;
    
    // Simulate resend OTP
    setTimeout(() => {
      this.isResending = false;
      this.showToastMessage('Mã OTP mới đã được gửi!', 'success');
    }, 1500);
  }

  navigateToLogin(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/recruiter/')) {
      this.router.navigate(['/recruiter/login']);
    } else {
      this.router.navigate(['/candidate/login']);
    }
  }

  navigateToForgotPassword(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/recruiter/')) {
      this.router.navigate(['/recruiter/forgot-password']);
    } else {
      this.router.navigate(['/candidate/forget-password']);
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
}