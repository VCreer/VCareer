import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomAuthService } from '../../../../core/services/custom-auth.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { AuthService as ProxyAuthService } from '../../../../proxy/services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './candidate-register.html',
  styleUrls: ['./candidate-register.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private customAuthService = inject(CustomAuthService);
  private googleAuthService = inject(GoogleAuthService);
   private proxyAuth = inject(ProxyAuthService);

  registerForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.nameValidator
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.nameValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(255)
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        this.usernameValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      termsAgreement: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.googleAuthService.initialize();
  }

  nameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const nameRegex = /^[a-zA-ZÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐđ\s]+$/;
    return nameRegex.test(value) ? null : { invalidName: true };
  }

  usernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(value) ? null : { invalidUsername: true };
  }

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

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
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
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} là bắt buộc`;
    if (errors['email']) return 'Email không hợp lệ';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} phải có ít nhất ${errors['minlength'].requiredLength} ký tự`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} không được vượt quá ${errors['maxlength'].requiredLength} ký tự`;
    if (errors['invalidName']) return 'Tên chỉ được chứa chữ cái và khoảng trắng';
    if (errors['invalidUsername']) return 'Tên đăng nhập chỉ được chứa chữ cái, số, gạch ngang và gạch dưới';
    if (errors['passwordStrength']) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';
    if (errors['passwordMismatch']) return 'Mật khẩu xác nhận không khớp';
    if (errors['requiredTrue']) return 'Bạn phải đồng ý với điều khoản dịch vụ và chính sách bảo mật';

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'firstName': 'Họ',
      'lastName': 'Tên',
      'email': 'Email',
      'username': 'Tên đăng nhập',
      'password': 'Mật khẩu',
      'confirmPassword': 'Xác nhận mật khẩu',
      'termsAgreement': 'Điều khoản'
    };
    return labels[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitAttempted));
  }

  onSubmit() {
  this.submitAttempted = true;

  Object.keys(this.registerForm.controls).forEach(key => {
    this.registerForm.get(key)?.markAsTouched();
  });

  if (this.registerForm.invalid) {
    const firstErrorField = Object.keys(this.registerForm.controls).find(key =>
      this.registerForm.get(key)?.invalid
    );
    if (firstErrorField) {
      const element = document.querySelector(`[formControlName="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  this.isLoading = true;

  // Ghép name = firstName + lastName
  const { firstName, lastName, email, password } = this.registerForm.value;
  const input = {
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: email.trim(),
    password: password
  };

  this.proxyAuth.candidateRegister(input)
    .subscribe({
      next: () => {
        this.isLoading = false;
        this.showToastMessage('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...', 'success');
        setTimeout(() => this.router.navigate(['/candidate/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        this.showToastMessage(msg, 'error');
      }
    });
}


  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  async signUpWithGoogle() {
    try {
      this.isLoading = true;
      
      // Sign up with Google
      const user = await this.googleAuthService.signInWithGoogle();
      
      console.log('Google user:', user);
      
      this.isLoading = false;
      this.showToastMessage('Đăng ký bằng Google thành công!', 'success');
      
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
      
    } catch (error) {
      console.error('Google sign up error:', error);
      this.isLoading = false;
      this.showToastMessage('Đăng ký bằng Google thất bại. Vui lòng thử lại.', 'error');
    }
  }
}
