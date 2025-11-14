import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  InputFieldComponent,
  PasswordFieldComponent,
  ButtonComponent,
  ToastNotificationComponent,
} from '../../../../shared/components';

import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';

@Component({
  selector: 'app-recruiter-login',
  standalone: true,
  templateUrl: './recruiter-login.html',
  styleUrls: ['./recruiter-login.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent,
  ],
})
export class RecruiterLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authFacade: AuthFacadeService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      rememberMe: [false],
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

    if (errors['email'] || errors['invalidEmail']) {
      return 'Email công ty không hợp lệ';
    }

    if (errors['minlength']) {
      return `Mật khẩu phải có ít nhất ${errors['minlength'].requiredLength} ký tự`;
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return fieldName === 'email'
        ? `Email không được quá ${requiredLength} ký tự`
        : `Mật khẩu không được quá ${requiredLength} ký tự`;
    }

    return '';
  }

  showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
   	this.showToast = true;

    setTimeout(() => (this.showToast = false), 3000);
  }

  onSubmit() {
    this.submitAttempted = true;

    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (this.loginForm.invalid) {
      const firstErrorField = Object.keys(this.loginForm.controls).find(
        key => this.loginForm.get(key)?.invalid
      );
      if (firstErrorField) {
        const element = document.querySelector(`[formControlName="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    this.authFacade
      .loginRecruiter({ email, password })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showToastMessage('Đăng nhập thành công!', 'success');

          setTimeout(() => {
            this.router.navigate(['/recruiter/home']);
          }, 800);
        },
        error: err => {
          this.isLoading = false;

          let msg = 'Đăng nhập thất bại. Vui lòng thử lại.';
          if (err?.status === 401) msg = 'Email hoặc mật khẩu không đúng.';
          else if (err?.status === 404) msg = 'Tài khoản không tồn tại.';
          else if (err?.error?.message) msg = err.error.message;

          this.showToastMessage(msg, 'error');

          this.loginForm.patchValue({ password: '' });
        },
      });
  }

  navigateToSignUp() {
    this.router.navigate(['/recruiter/register']);
  }

  forgotPassword() {
    this.router.navigate(['/recruiter/forgot-password']);
  }

  goToSelector() {
    this.router.navigate(['/auth/selector']);
  }
}
