import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomAuthService } from '../services/custom-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private customAuthService = inject(CustomAuthService);

  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  submitAttempted = false;
  showSuccessMessage = false;

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

  // Validator cho tên (chỉ chữ cái và khoảng trắng)
  nameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const nameRegex = /^[a-zA-ZÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐđ\s]+$/;
    return nameRegex.test(value) ? null : { invalidName: true };
  }

  // Validator cho username (chỉ chữ, số, gạch ngang, gạch dưới)
  usernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(value) ? null : { invalidUsername: true };
  }

  // Validator cho độ mạnh mật khẩu
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

  // Validator kiểm tra mật khẩu khớp
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Lấy thông báo lỗi cho field
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

  // Lấy label cho field
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

  // Kiểm tra field có lỗi không
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitAttempted));
  }

  // Chuyển đổi hiển thị mật khẩu
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Chuyển đổi hiển thị xác nhận mật khẩu
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Xử lý submit form
  onSubmit() {
    this.submitAttempted = true;
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.valid) {
      this.isLoading = true;
      const { firstName, lastName, email, username, password, termsAgreement } = this.registerForm.value;
      
      // Sử dụng CustomAuthService để đăng ký
      this.customAuthService.register({
        firstName,
        lastName,
        email,
        username,
        password,
        termsAgreement
      }).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.isSuccess) {
            this.showSuccessMessage = true;
            // Hiển thị thông báo thành công trong 3 giây trước khi chuyển đến login
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          } else {
            console.error('Đăng ký thất bại:', result.error);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Đăng ký thất bại:', error);
        }
      });
    } else {
      const firstErrorField = Object.keys(this.registerForm.controls).find(key =>
        this.registerForm.get(key)?.invalid
      );
      if (firstErrorField) {
        const element = document.querySelector(`[formControlName="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // Chuyển đến trang đăng nhập
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  // Đăng ký bằng Google
  signUpWithGoogle() {
    console.log('Đăng ký bằng Google');
  }
}