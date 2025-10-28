import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomAuthService } from '../../../../core/services/custom-auth';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';

@Component({
  selector: 'app-recruiter-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
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

    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password, rememberMe } = this.loginForm.value;
      
      setTimeout(() => {
        this.isLoading = false;
        
        if (email === 'admin@company.com' && password === 'admin123') {
          this.showToastMessage('Đăng nhập thành công!', 'success');
          localStorage.setItem('justLoggedIn', 'true');
          setTimeout(() => {
            this.router.navigate(['/recruiter/dashboard']);
          }, 2000);
        } else if (email === 'test@company.com' || email === 'testrecruiter') {
          this.showToastMessage('Mật khẩu không đúng. Vui lòng nhập lại.', 'error');
          this.loginForm.patchValue({ password: '' });
        } else {
          this.showToastMessage('Đăng nhập thành công!', 'success');
          localStorage.setItem('justLoggedIn', 'true');
          setTimeout(() => {
            this.router.navigate(['/recruiter/dashboard']);
          }, 2000);
        }
      }, 1500);
    } else {
      const firstErrorField = Object.keys(this.loginForm.controls).find(key =>
        this.loginForm.get(key)?.invalid
      );
      if (firstErrorField) {
        const element = document.querySelector(`[formControlName="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
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