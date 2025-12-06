import { Component, OnInit, inject } from '@angular/core';
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
import { finalize } from 'rxjs/operators';

import {
  InputFieldComponent,
  PasswordFieldComponent,
  ButtonComponent,
  ToastNotificationComponent,
} from '../../../../shared/components';

import { AuthFacadeService } from '../../../../core/services/auth-Cookiebased/auth-facade.service';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { NavigationService } from '../../../../core/services/navigation.service';

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
export class RecruiterLoginComponent implements OnInit {
  private googleAuthService = inject(GoogleAuthService);
  private navigationService = inject(NavigationService);

  loginForm: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authFacade: AuthFacadeService,
    private teamManagementService: TeamManagementService
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

          // Kiểm tra role trước khi redirect
          // Nếu không phải recruiter role → hiển thị lỗi
          this.authFacade.loadCurrentUser().subscribe({
            next: (user) => {
              const roles = user?.roles || [];
              const rolesLowerCase = roles.map((r: string) => r.toLowerCase());
              const isRecruiter = rolesLowerCase.some((r: string) => r.includes('recruiter') || r === 'hr_staff');

              // if (!isRecruiter) {
              //   this.isLoading = false;
              //   this.showToastMessage('Tài khoản này không có quyền truy cập vào hệ thống recruiter!', 'error');
              //   // Logout user
              //   this.authFacade.logout().subscribe();
              //   return;
              // }

              this.showToastMessage('Đăng nhập thành công!', 'success');

              // Kiểm tra xem user có phải là Leader không để redirect đúng trang
              this.teamManagementService.getCurrentUserInfo().subscribe({
                next: (userInfo) => {
                  setTimeout(() => {
                    if (userInfo.isLead) {
                      // Leader recruiter -> redirect đến trang verify
                      this.router.navigate(['/recruiter/recruiter-verify']);
                    } else {
                      // HR Staff -> redirect đến trang setting
                      this.router.navigate(['/recruiter/recruiter-setting']);
                    }
                  }, 800);
                },
                error: (error) => {
                  console.error('Error loading user info after login:', error);
                  // Fallback: redirect đến trang home nếu không lấy được thông tin
                  setTimeout(() => {
                    this.router.navigate(['/recruiter/home']);
                  }, 800);
                }
              });
            },
            error: (error) => {
              console.error('Error loading current user after login:', error);
              this.isLoading = false;
              this.showToastMessage('Không thể xác thực tài khoản. Vui lòng thử lại.', 'error');
            }
          });
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

  ngOnInit(): void {
    this.googleAuthService.initialize();
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      console.log('Starting Google sign in for recruiter...');
      
      // Sign in with Google to get idToken
      const googleUser = await this.googleAuthService.signInWithGoogle();
      console.log('Google user received:', { 
        id: googleUser.id, 
        email: googleUser.email, 
        name: googleUser.name,
        hasIdToken: !!googleUser.idToken 
      });
      
      if (!googleUser.idToken) {
        throw new Error('Không thể lấy token từ Google');
      }

      console.log('Calling backend API with idToken for recruiter...');
      // Call backend API with Google idToken và role recruiter
      this.authFacade.loginWithGoogle({ idToken: googleUser.idToken, role: 'recruiter' })
        .pipe(finalize(() => {
          this.isLoading = false;
          console.log('Google login request completed');
        }))
        .subscribe({
          next: () => {
            console.log('Google login successful');
            // Kiểm tra role trước khi redirect
            this.authFacade.loadCurrentUser().subscribe({
              next: (user) => {
                const roles = user?.roles || [];
                const rolesLowerCase = roles.map((r: string) => r.toLowerCase());
                const isRecruiter = rolesLowerCase.some((r: string) => r.includes('recruiter') || r === 'hr_staff');

                if (!isRecruiter) {
                  this.showToastMessage('Tài khoản này không có quyền truy cập vào hệ thống recruiter!', 'error');
                  this.authFacade.logout().subscribe();
                  return;
                }

                this.showToastMessage('Đăng nhập bằng Google thành công!', 'success');
                this.navigationService.loginAsRecruiter();

                // Kiểm tra xem user có phải là Leader không để redirect đúng trang
                this.teamManagementService.getCurrentUserInfo().subscribe({
                  next: (userInfo) => {
                    setTimeout(() => {
                      if (userInfo.isLead) {
                        this.router.navigate(['/recruiter/recruiter-verify']);
                      } else {
                        this.router.navigate(['/recruiter/recruiter-setting']);
                      }
                    }, 800);
                  },
                  error: (error) => {
                    console.error('Error loading user info after login:', error);
                    setTimeout(() => {
                      this.router.navigate(['/recruiter/home']);
                    }, 800);
                  }
                });
              },
              error: (error) => {
                console.error('Error loading current user after login:', error);
                this.showToastMessage('Không thể xác thực tài khoản. Vui lòng thử lại.', 'error');
              }
            });
          },
          error: (err) => {
            console.error('Google login API error:', err);
            console.error('Error details:', {
              status: err?.status,
              statusText: err?.statusText,
              error: err?.error,
              message: err?.message,
              url: err?.url
            });
            
            let msg = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
            
            if (err?.error?.message) {
              msg = err.error.message;
            } else if (err?.error?.error_description) {
              msg = err.error.error_description;
            } else if (err?.error?.error) {
              msg = err.error.error;
            } else if (err?.message) {
              msg = err.message;
            } else if (err?.status === 0) {
              msg = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            } else if (err?.status === 401) {
              msg = 'Xác thực Google thất bại. Vui lòng thử lại.';
            } else if (err?.status === 500) {
              msg = 'Lỗi server. Vui lòng thử lại sau.';
            }
            
            this.showToastMessage(msg, 'error');
          }
        });
      
    } catch (error: any) {
      console.error('Google sign in error:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      this.isLoading = false;
      
      let errorMsg = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
      
      if (error?.message) {
        errorMsg = error.message;
      } else if (error?.error) {
        errorMsg = error.error;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      // Xử lý các lỗi phổ biến của Google OAuth
      if (errorMsg.includes('popup_closed_by_user') || errorMsg.includes('popup closed')) {
        errorMsg = 'Bạn đã đóng cửa sổ đăng nhập Google. Vui lòng thử lại.';
      } else if (errorMsg.includes('access_denied')) {
        errorMsg = 'Bạn đã từ chối quyền truy cập Google. Vui lòng thử lại và cấp quyền.';
      } else if (errorMsg.includes('idpiframe_initialization_failed')) {
        errorMsg = 'Không thể khởi tạo Google OAuth. Vui lòng kiểm tra kết nối mạng và thử lại.';
      }
      
      this.showToastMessage(errorMsg, 'error');
    }
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
