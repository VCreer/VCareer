import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../core/services/navigation.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { finalize } from 'rxjs/operators';
import {AuthFacadeService} from '../../../../core/services/auth-Cookiebased/auth-facade.service';




@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './candidate-login.html',
  styleUrls: ['./candidate-login.scss'],
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class LoginComponent {
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacadeService);
  private googleAuthService = inject(GoogleAuthService);

  loginForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

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

  ngOnInit(): void {
    this.googleAuthService.initialize();
  }

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

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || (!field.touched && !this.submitAttempted)) return '';

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

    Object.keys(this.loginForm.controls).forEach(k =>
      this.loginForm.get(k)?.markAsTouched()
    );

    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    const payload = { email: username, password };

    this.authFacade.loginCandidate(payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          // Lưu trạng thái đăng nhập vào navigation service
          this.navigationService.loginAsCandidate();
          this.showToastMessage('Đăng nhập thành công!', 'success');
          setTimeout(() => this.router.navigate(['/']), 800);
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.error?.error_description ||
            err?.error?.error ||
            'Đăng nhập thất bại. Vui lòng thử lại.';
          this.showToastMessage(msg, 'error');
        }
      });
  }



  navigateToSignUp() {
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      
      // Sign in with Google
      const user = await this.googleAuthService.signInWithGoogle();
      
      console.log('Google user:', user);
      
      this.isLoading = false;
      this.showToastMessage('Đăng nhập bằng Google thành công!', 'success');
      this.navigationService.loginAsCandidate();
      
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
      
    } catch (error) {
      console.error('Google sign in error:', error);
      this.isLoading = false;
      this.showToastMessage('Đăng nhập bằng Google thất bại. Vui lòng thử lại.', 'error');
    }
  }
}
