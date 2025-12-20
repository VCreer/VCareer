import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { 
  InputFieldComponent, 
  PasswordFieldComponent, 
  ButtonComponent, 
  ToastNotificationComponent 
} from '../../../../shared/components';
import { AuthService } from '../../../../proxy/services/auth/auth.service';
import { RecruiterRegisterDto } from '../../../../proxy/dto/auth-dto/models';

@Component({
  selector: 'app-recruiter-register',
  standalone: true,
  templateUrl: './recruiter-register.html',
  styleUrls: ['./recruiter-register.scss'],
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    InputFieldComponent,
    PasswordFieldComponent,
    ButtonComponent,
    ToastNotificationComponent
  ]
})
export class RecruiterRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private googleAuthService = inject(GoogleAuthService);
  private authService = inject(AuthService);

  registerForm!: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  ngOnInit(): void {
    this.initializeForm();
    this.googleAuthService.initialize();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(25)]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      taxCode: ['', [Validators.required, Validators.pattern(/^\d{10}$|^\d{13}$/)], [this.taxCodeValidator()]],
      city: ['', [Validators.required]],
      district: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Async validator để kiểm tra mã số thuế qua API VietQR
   * Gọi qua backend proxy endpoint để tránh CORS issue
   * Nếu mã số thuế tồn tại (code !== "52"), tức là đã có trong hệ thống
   */
  private taxCodeValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const taxCode = control.value?.trim();
      
      // Nếu chưa nhập hoặc không hợp lệ format, không validate
      if (!taxCode || !/^\d{10}$|^\d{13}$/.test(taxCode)) {
        return of(null);
      }

      // Debounce 500ms để tránh gọi API quá nhiều khi user đang gõ
      return timer(500).pipe(
        switchMap(() => {
          // Gọi backend proxy endpoint thay vì gọi trực tiếp VietQR API
          const baseUrl = environment.apis?.default?.url || 'https://localhost:44385';
          const apiUrl = `${baseUrl}/api/app/tax-code/validate/${taxCode}`;
          return this.http.get<any>(apiUrl).pipe(
            map(response => {
              // VietQR: code === "52" => Tax invalid (MST không tồn tại)
              // Logic mới: chỉ chặn khi mã số thuế KHÔNG tồn tại / không hợp lệ.
              if (response.code && response.code === '52') {
                return { taxCodeInvalid: true };
              }
              // Các trường hợp còn lại coi như hợp lệ, cho phép đăng ký
              return null;
            }),
            catchError((error) => {
              // Nếu API lỗi, log và không block user
              console.warn('Cannot validate tax code. Allowing form submission.', error);
              // Return null để không block form submission
              return of(null);
            })
          );
        })
      );
    };
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    // Hiển thị lỗi nếu field đã được touch hoặc đã submit
    if (!this.submitAttempted && !field.touched) return '';

    const errors = field.errors;

    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} là bắt buộc`;
    }

    if (errors['email']) {
      return 'Email không hợp lệ';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} phải có ít nhất ${requiredLength} ký tự`;
    }

    if (errors['pattern']) {
      if (fieldName === 'taxCode') {
        return 'Mã số thuế phải có 10 hoặc 13 chữ số';
      }
      return `${this.getFieldLabel(fieldName)} không đúng định dạng`;
    }

    if (errors['taxCodeInvalid']) {
      return 'Mã số thuế không tồn tại hoặc không hợp lệ theo VietQR';
    }

    if (errors['passwordMismatch']) {
      return 'Mật khẩu xác nhận không khớp';
    }

    if (errors['requiredTrue']) {
      return 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      fullName: 'Họ và tên',
      gender: 'Giới tính',
      phone: 'Số điện thoại cá nhân',
      companyName: 'Tên công ty',
      taxCode: 'Mã số thuế',
      city: 'Tỉnh/thành phố',
      district: 'Quận/huyện',
      agreeTerms: 'Đồng ý điều khoản'
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

  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitAttempted));
  }

  onSubmit() {
    this.submitAttempted = true;
    
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });

    if (this.registerForm.valid) {
      this.isLoading = true;
      const formData = this.registerForm.value;
      
      const { confirmPassword, ...apiData } = formData;
      
      // Map form data sang RecruiterRegisterDto (backend)
      const registerDto: RecruiterRegisterDto = {
        email: apiData.email?.trim(),
        password: apiData.password,
        name: apiData.fullName?.trim(),
        phoneNumber: apiData.phone?.trim(),
        provinceCode: Number(apiData.city),
        districtCode: Number(apiData.district),
        companyName: apiData.companyName?.trim(),
        taxCode: apiData.taxCode?.trim(),
      };
      
      this.authService.recruiterRegister(registerDto).subscribe({
        next: () => {
          this.isLoading = false;
          this.showToastMessage('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');
          setTimeout(() => {
            this.router.navigate(['/recruiter/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage =
            error.error?.error?.message ||
            error.error?.message ||
            error.message ||
            'Có lỗi xảy ra. Vui lòng thử lại.';
          this.showToastMessage(errorMessage, 'error');
        },
      });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  goToLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  navigateToTermsOfService(event: Event): void {
    event.preventDefault();
    window.open('/recruiter/terms-of-service', '_blank');
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      
      // Sign up with Google
      const user = await this.googleAuthService.signInWithGoogle();
      
      console.log('Google user:', user);
      
      this.isLoading = false;
      this.showToastMessage('Đăng ký bằng Google thành công!', 'success');
      
      setTimeout(() => {
        this.router.navigate(['/recruiter/dashboard']);
      }, 2000);
      
    } catch (error) {
      console.error('Google sign up error:', error);
      this.isLoading = false;
      this.showToastMessage('Đăng ký bằng Google thất bại. Vui lòng thử lại.', 'error');
    }
  }

  goToSelector() {
    this.router.navigate(['/auth/selector']);
  }
}
