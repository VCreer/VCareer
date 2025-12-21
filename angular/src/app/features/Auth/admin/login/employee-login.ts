import { Component, OnInit, inject } from '@angular/core';
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
import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';
import { AuthStateService } from '../../../../core/services/auth-Cookiebased/auth-state.service';
import { EmployeeLoginDto } from '../../../../proxy/dto/auth-dto/models';
import { filter, take } from 'rxjs/operators';

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
    LogoSectionComponent
  ],
  templateUrl: './employee-login.html',
  styleUrls: ['./employee-login.scss']
})
export class EmployeeLoginComponent implements OnInit {
  employeeLoginForm!: FormGroup;
  isLoading: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'error';

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authFacade = inject(AuthFacadeService);
  private authState = inject(AuthStateService);

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.employeeLoginForm = this.fb.group({
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
    if (this.employeeLoginForm.valid) {
      this.isLoading = true;
      const formData = this.employeeLoginForm.value;
      
      const loginDto: EmployeeLoginDto = {
        email: formData.username, // EmployeeLoginDto dùng email, nhưng form dùng username
        password: formData.password
      };

      this.authFacade.loginEmployee(loginDto).subscribe({
        next: () => {
          // Đợi user state được set xong trước khi navigate
          this.authState.user$.pipe(
            filter(user => user !== null && user.roles && user.roles.length > 0), // Đảm bảo user có roles
            take(1) // Chỉ lấy giá trị đầu tiên
          ).subscribe(user => {
            console.log('[EmployeeLogin] User state set with roles, navigating...', user);
            this.isLoading = false;
            this.showToastMessage('Đăng nhập thành công!', 'success');
            
            // Navigate sau khi user state đã được set và có roles
            setTimeout(() => {
              this.router.navigate(['/employee']).then(() => {
                // Route /employee sẽ tự động redirect đến /employee/statistical-reports
                console.log('[EmployeeLogin] Navigated to /employee');
              }).catch(err => {
                console.error('Navigation error:', err);
              });
            }, 200);
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Login error:', err);
          this.showToastMessage('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
        }
      });
    } else {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
      Object.keys(this.employeeLoginForm.controls).forEach(key => {
        this.employeeLoginForm.get(key)?.markAsTouched();
      });
    }
  }
}
