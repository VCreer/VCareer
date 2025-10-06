import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {
  adminLoginForm!: FormGroup;
  showPassword: boolean = false;
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
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getFieldError(fieldName: string): string {
    const field = this.adminLoginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} phải có ít nhất 6 ký tự`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
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
      console.log('Admin login data:', formData);
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        
        // Mock admin credentials
        if (formData.email === 'admin@vcareer.com' && formData.password === 'admin123') {
          this.showToastMessage('Đăng nhập thành công!', 'success');
          
          // Redirect to admin dashboard after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/admin/dashboard']);
          }, 2000);
        } else {
          this.showToastMessage('Email hoặc mật khẩu không đúng!', 'error');
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