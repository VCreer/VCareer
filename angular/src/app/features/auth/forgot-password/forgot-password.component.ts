import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.showErrorMessage = false;
      this.showSuccessMessage = false;
      
      const email = this.forgotPasswordForm.get('email')?.value;
      
      // Simulate API call to send OTP
      setTimeout(() => {
        this.isLoading = false;
        
        // Simulate API call with different scenarios
        if (email === 'test@example.com' || email === 'testuser') {
          // Email doesn't exist
          this.showErrorMessage = true;
          this.showSuccessMessage = false;
          this.errorMessage = 'Email không tồn tại';
          
          // Hide error message after 5 seconds
          setTimeout(() => {
            this.showErrorMessage = false;
          }, 5000);
        } else {
          // Email exists - send OTP and redirect to OTP verification
          this.showSuccessMessage = true;
          this.showErrorMessage = false;
          
          // Store email for OTP verification
          localStorage.setItem('reset_email', email);
          
          // Redirect to OTP verification page after 2 seconds
          setTimeout(() => {
            const currentUrl = this.router.url;
            if (currentUrl.includes('/recruiter/')) {
              this.router.navigate(['/recruiter/verify-otp']);
            } else {
              this.router.navigate(['/candidate/verify-otp']);
            }
          }, 2000);
        }
      }, 2000);
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
    return !!(field && field.invalid && (field.dirty || field.touched));
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
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
    this.errorMessage = '';
  }
}