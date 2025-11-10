import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent, 
  LogoSectionComponent 
} from '../../../../shared/components';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent,
    LogoSectionComponent
  ],
  templateUrl: './employee-login.html',
  styleUrls: ['./employee-login.scss']
})
export class AdminLoginComponent implements OnInit {
  adminLoginForm!: FormGroup;
  isLoading: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.adminLoginForm = this.fb.group({
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
      ]]
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

  getFieldError(fieldName: string): string {
    const field = this.adminLoginForm.get(fieldName);
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
    const labels: { [key: string]: string } = {
      username: 'Tên đăng nhập',
      password: 'Mật khẩu'
    };
    return labels[fieldName] || fieldName;
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
    if (this.adminLoginForm.valid) {
      this.isLoading = true;
      const formData = this.adminLoginForm.value;
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        
        // Mock admin credentials
        if (formData.username === 'admin' && formData.password === 'admin123') {
          this.showToastMessage('Đăng nhập thành công!', 'success');
          
          // Redirect to admin dashboard after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/admin/dashboard']);
          }, 2000);
        } else {
          this.showToastMessage('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
        }
      }, 2000);
    } else {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
      // Mark all fields as touched to show validation errors
      Object.keys(this.adminLoginForm.controls).forEach(key => {
        this.adminLoginForm.get(key)?.markAsTouched();
      });
    }
  }
}
