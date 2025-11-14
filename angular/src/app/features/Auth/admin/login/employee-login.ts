import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  InputFieldComponent,
  PasswordFieldComponent,
  ButtonComponent,
  ToastNotificationComponent,
  LogoSectionComponent,
} from '../../../../shared/components';

import { EmployeeLoginDto } from 'src/app/proxy/dto/auth-dto';
import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';

@Component({
  selector: 'app-employee-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent,
    LogoSectionComponent,
  ],
  templateUrl: './employee-login.html',
  styleUrls: ['./employee-login.scss'],
})
export class EmployeeLoginComponent {
  employeeLoginForm!: FormGroup;
  isLoading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authFacade: AuthFacadeService
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.employeeLoginForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          this.emailOrUsernameValidator,
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    });
  }

  private emailOrUsernameValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    return emailRegex.test(value) || usernameRegex.test(value)
      ? null
      : { invalidFormat: true };
  };

  getFieldError(fieldName: string): string {
    const field = this.employeeLoginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} không được vượt quá ${field.errors['maxlength'].requiredLength} ký tự`;
      }
      if (field.errors['invalidFormat']) {
        return `${this.getFieldLabel(fieldName)} không đúng định dạng`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      username: 'Tên đăng nhập',
      password: 'Mật khẩu',
    };
    return labels[fieldName] || fieldName;
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  onSubmit(): void {
    if (this.employeeLoginForm.invalid) {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
      Object.values(this.employeeLoginForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.isLoading = true;

    const { username, password } = this.employeeLoginForm.value;
    const input: EmployeeLoginDto = {
      email: username,
      password: password,
    };

    this.authFacade.loginEmployee(input).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToastMessage('Đăng nhập thành công!', 'success');

        setTimeout(() => {
          this.router.navigate(['/employee/home']).catch(() => {
            this.router.navigate(['/employee']);
          });
        }, 1200);
      },
      error: err => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng!';
        this.showToastMessage(msg, 'error');
      },
    });
  }
}
