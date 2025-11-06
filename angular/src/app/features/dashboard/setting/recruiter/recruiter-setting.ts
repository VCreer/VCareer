import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
 import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import { ProfileDto, UpdatePersonalInfoDto, ChangePasswordDto } from '../../../../proxy/profile/models';
import { NavigationService } from '../../../../core/services/navigation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ProfileAvatarComponent } from '../../../../shared/components/profile-avatar/profile-avatar';
import { PasswordFieldComponent } from '../../../../shared/components/password-field/password-field';
import { CompanyTabsComponent } from '../../../../shared/components/company-tabs/company-tabs.component';
import { SearchCompanyComponent } from '../../../../shared/components/search-company/search-company.component';
import { CreateCompanyFormComponent } from '../../../../shared/components/create-company-form/create-company-form.component';
import { BusinessRegistrationComponent } from '../../../../shared/components/business-registration/business-registration.component';
import { PasswordFormActionsComponent } from '../../../../shared/components/password-form-actions/password-form-actions.component';

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
    PasswordFieldComponent,
    CompanyTabsComponent,
    SearchCompanyComponent,
    CreateCompanyFormComponent,
    BusinessRegistrationComponent,
    PasswordFormActionsComponent
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
  setPasswordForm: FormGroup; // Form for Google users to set password first time
  isChangingPassword = false;
  logoutAllSessions = false;
  isGoogleUser = false; // Flag to check if user logged in with Google
  hasPasswordSet = true; // Flag to check if user has set password (default true for normal users)
  isSettingPassword = false; // Flag for setting password first time
  
  // Account verification
  verificationLevel: string = 'Cấp 1/3';
  verificationProgress: number = 0;
  verificationSteps = [
    { id: 1, label: 'Xác thực số điện thoại', completed: false },
    { id: 2, label: 'Cập nhật thông tin công ty', completed: false },
    { id: 3, label: 'Xác thực Giấy đăng ký doanh nghiệp', completed: false }
  ];

  // Company info
  companyTab: string = 'search'; // 'search' or 'create'
  companySearchKeyword: string = '';
  companyList: any[] = [];
  isSearchingCompany: boolean = false;
  
  // Create company form data
  companyFormData = {
    companyType: 'enterprise',
    taxId: '',
    website: '',
    scale: '',
    email: '',
    companyName: '',
    industry: '',
    address: '',
    phone: '',
    description: ''
  };
  companyLogoPreview: string | null = null;
  isSavingCompany: boolean = false;
  companyFormErrors: any = {};

  // Settings
  cvApplicationNotificationEnabled: boolean = true;

  // Business Registration
  businessCertDocumentType: string = 'business-cert';
  businessCertFile: File | null = null;
  isSavingBusinessCert: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    // Initialize change password form (for users who already have password)
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    
    // Initialize set password form (for Google users setting password first time)
    this.setPasswordForm = this.formBuilder.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    
    // Subscribe to value changes to trigger validation
    this.changePasswordForm.valueChanges.subscribe(() => {
      if (this.changePasswordForm.get('newPassword')?.value && this.changePasswordForm.get('confirmPassword')?.value) {
        this.changePasswordForm.updateValueAndValidity();
      }
    });
    
    // Subscribe to set password form value changes
    this.setPasswordForm.valueChanges.subscribe(() => {
      if (this.setPasswordForm.get('newPassword')?.value && this.setPasswordForm.get('confirmPassword')?.value) {
        this.setPasswordForm.updateValueAndValidity();
      }
    });
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
        this.cdr.detectChanges();
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
        
        // TODO: Check if user is Google user from backend
        // For now, we'll check via userType or a specific field
        // Assuming if userType is 'External' or similar, it's a Google user
        // This is a placeholder - adjust based on your actual backend response
        this.isGoogleUser = profile.userType === 'External' || false;
        // If Google user, assume password not set initially (will be updated after first set)
        // TODO: Add a field in ProfileDto to check if password is set
        this.hasPasswordSet = !this.isGoogleUser || profile.emailConfirmed; // Temporary logic
        
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
        // Default to non-Google user if error
        this.isGoogleUser = false;
        this.hasPasswordSet = true;
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
      if (this.isGoogleUser && !this.hasPasswordSet) {
        this.setPasswordForm.reset();
      } else {
        this.changePasswordForm.reset();
        this.logoutAllSessions = false;
      }
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

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    if (!(form instanceof FormGroup)) return null;
    
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    // Only validate if both fields have values
    if (!password.value || !confirmPassword.value) {
      // Clear mismatch error if one field is empty
      if (confirmPassword.hasError('passwordMismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
    }
    
    // Set error on confirmPassword if passwords don't match
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear mismatch error if passwords match
      if (confirmPassword.hasError('passwordMismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
    
    return null;
  }
  
  onChangePassword(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Mark all fields as touched to show validation errors
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      this.changePasswordForm.get(key)?.markAsTouched();
    });
    
    // Mark form as touched to trigger validators
    this.changePasswordForm.markAllAsTouched();
    
    if (this.changePasswordForm.invalid) {
      // Show specific error messages
      const currentPasswordError = this.getPasswordError('currentPassword');
      const newPasswordError = this.getPasswordError('newPassword');
      const confirmPasswordError = this.getPasswordError('confirmPassword');
      
      if (currentPasswordError) {
        this.showToastMessage(currentPasswordError, 'error');
      } else if (newPasswordError) {
        this.showToastMessage(newPasswordError, 'error');
      } else if (confirmPasswordError) {
        this.showToastMessage(confirmPasswordError, 'error');
      } else {
        this.showToastMessage('Vui lòng điền đầy đủ thông tin và kiểm tra lại mật khẩu', 'error');
      }
      return;
    }

    this.isChangingPassword = true;

    const currentPassword = this.changePasswordForm.get('currentPassword')?.value;
    const newPassword = this.changePasswordForm.get('newPassword')?.value;
    
    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      this.showToastMessage('Mật khẩu mới phải khác mật khẩu hiện tại', 'error');
      this.isChangingPassword = false;
      return;
    }

    const changePasswordDto: ChangePasswordDto = {
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: this.changePasswordForm.get('confirmPassword')?.value
    };

    this.profileService.changePassword(changePasswordDto).subscribe({
      next: () => {
        this.isChangingPassword = false;
        
        // Save logoutAllSessions value before reset
        const shouldLogoutAll = this.logoutAllSessions;
        
        // Reset form immediately to default empty state (like the image)
        this.changePasswordForm.reset();
        this.logoutAllSessions = false;
        
        this.showToastMessage('Đổi mật khẩu thành công!', 'success');
        
        // If logout all sessions was checked, logout and redirect to login
        if (shouldLogoutAll) {
          setTimeout(() => {
            this.navigationService.logout();
            this.router.navigate(['/recruiter/login']);
          }, 1500);
        }
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
  
  // Handle setting password for Google users (first time)
  onSetPassword(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Mark all fields as touched to show validation errors
    Object.keys(this.setPasswordForm.controls).forEach(key => {
      this.setPasswordForm.get(key)?.markAsTouched();
    });
    
    this.setPasswordForm.markAllAsTouched();
    
    if (this.setPasswordForm.invalid) {
      const newPasswordError = this.getSetPasswordError('newPassword');
      const confirmPasswordError = this.getSetPasswordError('confirmPassword');
      
      if (newPasswordError) {
        this.showToastMessage(newPasswordError, 'error');
      } else if (confirmPasswordError) {
        this.showToastMessage(confirmPasswordError, 'error');
      } else {
        this.showToastMessage('Vui lòng điền đầy đủ thông tin và kiểm tra lại mật khẩu', 'error');
      }
      return;
    }
    
    const newPassword = this.setPasswordForm.get('newPassword')?.value;
    const confirmPassword = this.setPasswordForm.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      this.showToastMessage('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    
    this.isSettingPassword = true;
    
    // For Google users, we need to set password without current password
    // TODO: Create a separate API endpoint for setting password first time for external users
    // For now, using changePassword with empty currentPassword as a workaround
    // Note: This might fail on backend - backend should handle external users differently
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: '', // Empty for Google users setting password first time
      newPassword: newPassword,
      confirmPassword: confirmPassword
    };
    
    this.profileService.changePassword(changePasswordDto).subscribe({
      next: () => {
        this.isSettingPassword = false;
        this.hasPasswordSet = true; // Mark password as set
        this.showToastMessage('Đặt mật khẩu thành công!', 'success');
        
        // Reset form and show full form for future password changes
        setTimeout(() => {
          this.setPasswordForm.reset();
        }, 2000);
      },
      error: (error) => {
        this.isSettingPassword = false;
        let errorMessage = 'Đặt mật khẩu thất bại. Vui lòng thử lại.';
        
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        // If error indicates password already set, update flag
        if (errorMessage.includes('Current password') || errorMessage.includes('incorrect')) {
          // This might mean password is already set, try normal change password flow
          this.hasPasswordSet = true;
        }
        
        this.showToastMessage(errorMessage, 'error');
      }
    });
  }

  getPasswordError(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName);
    if (!field) return '';
    
    // Check if field is touched or form is submitted
    if (!field.touched && !this.changePasswordForm.touched) {
      return '';
    }
    
    if (!field.errors) return '';

    const errors = field.errors;
    
    // Check form-level errors for passwordMismatch
    if (fieldName === 'confirmPassword' && this.changePasswordForm.errors?.['passwordMismatch']) {
      return 'Mật khẩu xác nhận không khớp';
    }
    
    if (errors['required']) {
      if (fieldName === 'currentPassword') {
        return 'Mật khẩu hiện tại là bắt buộc';
      } else if (fieldName === 'newPassword') {
        return 'Mật khẩu mới là bắt buộc';
      } else {
        return 'Xác nhận mật khẩu là bắt buộc';
      }
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

  getSetPasswordError(fieldName: string): string {
    const field = this.setPasswordForm.get(fieldName);
    if (!field) return '';
    
    // Check if field is touched or form is submitted
    if (!field.touched && !this.setPasswordForm.touched) {
      return '';
    }
    
    if (!field.errors) return '';

    const errors = field.errors;
    
    // Check form-level errors for passwordMismatch
    if (fieldName === 'confirmPassword' && this.setPasswordForm.errors?.['passwordMismatch']) {
      return 'Mật khẩu xác nhận không khớp';
    }
    
    if (errors['required']) {
      if (fieldName === 'newPassword') {
        return 'Mật khẩu mới là bắt buộc';
      } else {
        return 'Xác nhận mật khẩu là bắt buộc';
      }
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

  setCompanyTab(tab: string) {
    this.companyTab = tab;
  }

  onSearchCompany(keyword?: string) {
    const searchKeyword = keyword || this.companySearchKeyword;
    if (!searchKeyword || !searchKeyword.trim()) {
      this.showToastMessage('Vui lòng nhập tên công ty', 'warning');
      return;
    }

    this.companySearchKeyword = searchKeyword;
    this.isSearchingCompany = true;
    this.companyList = [];

    // TODO: Call API to search companies
    // Mock data for now
    setTimeout(() => {
      this.companyList = [
        {
          id: 1,
          name: 'Trần Quốc Phong',
          taxId: '0401526431',
          address: '68 Lý Tự Trọng, phường Thạch Than...',
          employeeRange: '10-24 nhân viên',
          logoBgColor: '#9ca3af',
          logoText: 'TP',
          tags: ['Thời trang']
        },
        {
          id: 2,
          name: 'Ge Media',
          taxId: '0312345678',
          address: '2/26 đường Đông Tây 1, phường ...',
          employeeRange: '25-99 nhân viên',
          logoBgColor: '#7c3aed',
          logoText: 'GM',
          tags: ['Internet / Online', 'Marketing / Truyền...']
        },
        {
          id: 3,
          name: 'CÔNG TY TRÁCH NHIỆM HỮU HẠN CÔNG NGHỆ VÀ GIẢI PHÁP WIS',
          taxId: '0123456789',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          employeeRange: '10-24 nhân viên',
          logoBgColor: '#14b8a6',
          logoText: 'CW',
          tags: ['Thương mại tổng hợp']
        },
        {
          id: 4,
          name: 'CÔNG TY TNHH NGỌC TRÂN AQUAS',
          taxId: '0987654321',
          address: '456 Đường XYZ, Quận 2, TP.HCM',
          employeeRange: '25-99 nhân viên',
          logoBgColor: '#92400e',
          logoText: 'CA',
          tags: ['Sản xuất']
        },
        {
          id: 5,
          name: 'CÔNG TY TNHH SX TM HÀ VINH',
          taxId: '0111222333',
          address: '789 Đường DEF, Quận 3, TP.HCM',
          employeeRange: '10-24 nhân viên',
          logoBgColor: '#ffffff',
          logoText: 'topcv',
          logoImage: 'assets/images/logo/logo.png',
          tags: ['Giáo dục / Đào tạo']
        },
        {
          id: 6,
          name: 'CÔNG TY TRÁCH NHIỆM HỮU HẠN PHU MY HUR HOLDINGS',
          taxId: '0444555666',
          address: '321 Đường GHI, Quận 4, TP.HCM',
          employeeRange: '25-99 nhân viên',
          logoBgColor: '#fbbf24',
          logoText: 'PM',
          tags: ['Khác']
        }
      ];
      this.isSearchingCompany = false;
    }, 800);
  }

  onSelectCompany(company: any) {
    // TODO: Handle company selection
    this.showToastMessage(`Đã chọn công ty: ${company.name}`, 'success');
  }

  onToggleCvApplicationNotification() {
    // TODO: Call API to save notification settings
    const status = this.cvApplicationNotificationEnabled ? 'bật' : 'tắt';
    this.showToastMessage(`Đã ${status} thông báo CV ứng tuyển`, 'success');
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  validateField(fieldName: string) {
    const value = this.companyFormData[fieldName as keyof typeof this.companyFormData];
    this.companyFormErrors[fieldName] = '';

    switch (fieldName) {
      case 'taxId':
        if (!value || (value as string).trim() === '') {
          this.companyFormErrors.taxId = 'Mã số thuế là bắt buộc';
        } else if (!/^\d{10}$|^\d{13}$/.test((value as string).trim())) {
          this.companyFormErrors.taxId = 'Mã số thuế phải có 10 hoặc 13 chữ số';
        }
        break;

      case 'companyName':
        if (!value || (value as string).trim() === '') {
          this.companyFormErrors.companyName = 'Tên công ty là bắt buộc';
        } else if ((value as string).trim().length < 3) {
          this.companyFormErrors.companyName = 'Tên công ty phải có ít nhất 3 ký tự';
        }
        break;

      case 'email':
        if (!value || (value as string).trim() === '') {
          this.companyFormErrors.email = 'Email là bắt buộc';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test((value as string).trim())) {
            this.companyFormErrors.email = 'Email không hợp lệ';
          }
        }
        break;

      case 'phone':
        if (!value || (value as string).trim() === '') {
          this.companyFormErrors.phone = 'Số điện thoại là bắt buộc';
        } else {
          const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
          if (!phoneRegex.test((value as string).trim())) {
            this.companyFormErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
          }
        }
        break;

      case 'address':
        if (!value || (value as string).trim() === '') {
          this.companyFormErrors.address = 'Địa chỉ là bắt buộc';
        } else if ((value as string).trim().length < 10) {
          this.companyFormErrors.address = 'Địa chỉ phải có ít nhất 10 ký tự';
        }
        break;

      case 'scale':
        if (!value || value === '') {
          this.companyFormErrors.scale = 'Vui lòng chọn quy mô công ty';
        }
        break;

      case 'industry':
        if (!value || value === '') {
          this.companyFormErrors.industry = 'Vui lòng chọn lĩnh vực hoạt động';
        }
        break;

      case 'website':
        if (value && (value as string).trim() !== '') {
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlRegex.test((value as string).trim())) {
            this.companyFormErrors.website = 'Website không hợp lệ (VD: https://example.com)';
          }
        }
        break;
    }
  }

  validateAllFields(): boolean {
    const requiredFields = ['taxId', 'companyName', 'email', 'phone', 'address', 'scale', 'industry'];
    let isValid = true;

    requiredFields.forEach(field => {
      this.validateField(field);
      if (this.companyFormErrors[field]) {
        isValid = false;
      }
    });

    // Validate optional fields if they have values
    if (this.companyFormData.website) {
      this.validateField('website');
      if (this.companyFormErrors.website) {
        isValid = false;
      }
    }

    return isValid;
  }

  onSaveCompany() {
    // Validate all fields
    if (!this.validateAllFields()) {
      this.showToastMessage('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
      return;
    }

    this.isSavingCompany = true;

    // TODO: Call API to save company
    setTimeout(() => {
      this.isSavingCompany = false;
      this.showToastMessage('Tạo công ty thành công!', 'success');
    }, 1000);
  }

  onBusinessCertDocumentTypeChange(type: string) {
    this.businessCertDocumentType = type;
    this.businessCertFile = null;
  }

  onBusinessCertFileSelected(event: {type: string, file: File}) {
    // Handle different file types for authorization
    if (event.type === 'business-cert') {
      this.businessCertFile = event.file;
    } else if (event.type === 'identification') {
      // Handle identification file (Giấy ủy quyền section is commented out)
    }
  }

  onSaveBusinessCert() {
    if (!this.businessCertFile) {
      this.showToastMessage('Vui lòng chọn file', 'error');
      return;
    }

    this.isSavingBusinessCert = true;

    // TODO: Call API to save business certificate
    setTimeout(() => {
      this.isSavingBusinessCert = false;
      this.showToastMessage('Lưu giấy đăng ký doanh nghiệp thành công!', 'success');
    }, 1000);
  }
}

