import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
 import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import { ProfileDto, UpdatePersonalInfoDto, ChangePasswordDto } from '../../../../proxy/profile/models';
import { NavigationService } from '../../../../core/services/navigation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ProfileAvatarComponent } from '../../../../shared/components/profile-avatar/profile-avatar';
import { PasswordFieldComponent } from '../../../../shared/components/password-field/password-field';

@Component({
  selector: 'app-recruiter-setting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    ToastNotificationComponent,
    ProfileAvatarComponent,
    PasswordFieldComponent
  ],
  templateUrl: './recruiter-setting.html',
  styleUrls: ['./recruiter-setting.scss']
})
export class RecruiterSettingComponent implements OnInit, OnDestroy {
  // Navigation state
  activeTab: string = 'personal-info'; // 'change-password', 'personal-info', 'business-cert', 'company-info', 'api-connection', 'settings'
  
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;
  
  // Profile data
  profileData = {
    fullName: '',
    email: '',
    phone: '',
    gender: 'male',
    avatarUrl: ''
  };
  
  isLoading = false;
  isSaving = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  // Change password form
  changePasswordForm: FormGroup;
  isChangingPassword = false;
  logoutAllSessions = false;
  
  // Account verification
  verificationLevel: string = 'Cấp 1/3';
  verificationProgress: number = 0;
  verificationSteps = [
    { id: 1, label: 'Xác thực số điện thoại', completed: false },
    { id: 2, label: 'Cập nhật thông tin công ty', completed: false },
    { id: 3, label: 'Xác thực Giấy đăng ký doanh nghiệp', completed: false }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    // Initialize change password form
    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Check if logged in and is recruiter
    if (!this.navigationService.isLoggedIn() || this.navigationService.getCurrentRole() !== 'recruiter') {
      this.router.navigate(['/recruiter/login'], { replaceUrl: true });
      return;
    }
    
    // Subscribe to router events to prevent unwanted redirects
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.url;
        if (!url.includes('/recruiter/recruiter-setting') && url === '/') {
          setTimeout(() => {
            this.router.navigateByUrl('/recruiter/recruiter-setting?tab=personal-info', { 
              skipLocationChange: false, 
              replaceUrl: true 
            });
          }, 0);
        }
      }
    });
    
    // Check route for tab parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    
    this.loadProfileData();
    this.loadVerificationStatus();
    this.checkSidebarState();
    
    // Check sidebar state periodically (since sidebar is in header component)
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  ngOnDestroy() {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar.show');
    this.sidebarExpanded = !!sidebar;
    
    // Update page class
    const page = document.querySelector('.recruiter-setting-page');
    if (page) {
      if (this.sidebarExpanded) {
        page.classList.add('sidebar-expanded');
      } else {
        page.classList.remove('sidebar-expanded');
      }
    }
  }

  loadProfileData() {
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/recruiter/recruiter-setting')) {
      return;
    }
    
    this.isLoading = true;
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile: ProfileDto) => {
        const name = profile.name || '';
        const surname = profile.surname || '';
        this.profileData = {
          fullName: `${name} ${surname}`.trim() || 'User',
          email: profile.email || '',
          phone: profile.phoneNumber || '',
          gender: profile.gender === true ? 'male' : profile.gender === false ? 'female' : 'male',
          avatarUrl: ''
        };
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 401 || error.status === 500) {
          return;
        }
        this.profileData = {
          fullName: 'Uông Hoàng Duy',
          email: 'duyuhhe171632@fpt.edu.vn',
          phone: '0966211316',
          gender: 'male',
          avatarUrl: ''
        };
      }
    });
  }

  loadVerificationStatus() {
    // TODO: Load from API
    // For now, using mock data
    this.verificationLevel = 'Cấp 1/3';
    this.verificationProgress = 0;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
      skipLocationChange: false
    });
  }

  onSaveProfile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!this.validateForm()) {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin', 'error');
      return false;
    }

    this.isSaving = true;
    
    const nameParts = this.profileData.fullName.trim().split(' ');
    const surname = nameParts.pop() || '';
    const name = nameParts.join(' ') || '';

    const updateDto: UpdatePersonalInfoDto = {
      name: name,
      surname: surname,
      phoneNumber: this.profileData.phone,
      gender: this.profileData.gender === 'male' ? true : this.profileData.gender === 'female' ? false : undefined
    };

    const targetUrl = '/recruiter/recruiter-setting?tab=personal-info';
    
    this.profileService.updatePersonalInfo(updateDto).subscribe({
      next: () => {
        this.isSaving = false;
        this.showToastMessage('Cập nhật thông tin thành công!', 'success');
        
        setTimeout(() => {
          if (!this.router.url.includes('/recruiter/recruiter-setting')) {
            this.router.navigateByUrl(targetUrl, { skipLocationChange: false, replaceUrl: true });
          }
        }, 100);
      },
      error: (error) => {
        this.isSaving = false;
        
        setTimeout(() => {
          if (!this.router.url.includes('/recruiter/recruiter-setting')) {
            this.router.navigateByUrl(targetUrl, { skipLocationChange: false, replaceUrl: true });
          }
        }, 100);
        
        if (error.status === 401) {
          this.showToastMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        } else {
          this.showToastMessage('Có lỗi xảy ra khi lưu thông tin', 'error');
        }
      }
    });
    
    return false;
  }

  validateForm(): boolean {
    if (!this.profileData.fullName?.trim()) {
      return false;
    }
    if (!this.profileData.phone?.trim()) {
      return false;
    }
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(this.profileData.phone)) {
      return false;
    }
    return true;
  }

  onVerifyPhone() {
    // TODO: Implement phone verification
    this.showToastMessage('Chức năng xác thực số điện thoại đang được phát triển', 'info');
  }

  onChangeAvatar(file: File) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileData.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onRemoveAvatar() {
    this.profileData.avatarUrl = '';
  }

  onLearnMore() {
    // TODO: Navigate to verification info page
  }

  onCancel() {
    if (this.activeTab === 'change-password') {
      this.changePasswordForm.reset();
      this.logoutAllSessions = false;
    } else {
      this.loadProfileData();
    }
  }
  
  // Password validators - theo form đăng ký candidate
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
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
  
  onChangePassword(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.changePasswordForm.invalid) {
      this.showToastMessage('Vui lòng điền đầy đủ thông tin và kiểm tra lại mật khẩu', 'error');
      return;
    }

    this.isChangingPassword = true;

    const changePasswordDto: ChangePasswordDto = {
      currentPassword: '', // TODO: Get current password if needed
      newPassword: this.changePasswordForm.get('newPassword')?.value,
      confirmPassword: this.changePasswordForm.get('confirmPassword')?.value
    };

    this.profileService.changePassword(changePasswordDto).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.showToastMessage('Đổi mật khẩu thành công!', 'success');
        
        // Reset form after successful change
        setTimeout(() => {
          this.changePasswordForm.reset();
          this.logoutAllSessions = false;
          
          // If logout all sessions is checked, logout and redirect to login
          if (this.logoutAllSessions) {
            this.navigationService.logout();
            this.router.navigate(['/recruiter/login']);
          }
        }, 2000);
      },
      error: (error) => {
        this.isChangingPassword = false;
        let errorMessage = 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
        
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showToastMessage(errorMessage, 'error');
      }
    });
  }
  
  getPasswordError(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    if (errors['required']) {
      return `${fieldName === 'newPassword' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu'} là bắt buộc`;
    }
    if (errors['minlength']) {
      return `${fieldName === 'newPassword' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu'} phải có ít nhất ${errors['minlength'].requiredLength} ký tự`;
    }
    if (errors['maxlength']) {
      return `${fieldName === 'newPassword' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu'} không được vượt quá ${errors['maxlength'].requiredLength} ký tự`;
    }
    if (errors['passwordStrength']) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';
    }
    if (errors['passwordMismatch']) {
      return 'Mật khẩu xác nhận không khớp';
    }
    return '';
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.showToast = false;
    this.toastMessage = '';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.showToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }, 100);
  }

  onToastClose() {
    this.showToast = false;
  }

  navigateToChangePassword() {
    this.setActiveTab('change-password');
  }

  getTabTitle(tab: string): string {
    const titles: { [key: string]: string } = {
      'change-password': 'Đổi mật khẩu',
      'personal-info': 'Thông tin cá nhân',
      'business-cert': 'Giấy đăng ký doanh nghiệp',
      'company-info': 'Thông tin công ty',
      'api-connection': 'Kết nối API',
      'settings': 'Cài đặt'
    };
    return titles[tab] || 'Cài đặt';
  }
}

