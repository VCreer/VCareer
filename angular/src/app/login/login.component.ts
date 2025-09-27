import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomAuthService } from '../services/custom-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent {
  private customAuthService = inject(CustomAuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  submitAttempted = false;
  showSuccessMessage = false;

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

  // Validator cho email hoặc username
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Lấy thông báo lỗi cho field
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

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
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (this.loginForm.valid) {
      this.isLoading = true;
      const { username, password, rememberMe } = this.loginForm.value;
      this.customAuthService.login({
        username,
        password,
        rememberMe
      }).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.isSuccess) {
            this.showSuccessMessage = true;
            // Đặt flag để trang home hiển thị thông báo thành công
            localStorage.setItem('justLoggedIn', 'true');
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000);
          } else {
            console.error('Đăng nhập thất bại:', result.error);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Đăng nhập thất bại:', error);
        }
      });
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
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    console.log('Quên mật khẩu');
  }

  signInWithGoogle() {
    console.log('Đăng nhập bằng Google');
  }
}