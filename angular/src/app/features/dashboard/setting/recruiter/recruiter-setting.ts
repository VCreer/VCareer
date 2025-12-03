import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import { CompanyLegalInfoDto, ProfileDto, UpdatePersonalInfoDto, ChangePasswordDto, VerifyPhoneNumberDto, VerifyEmailNumberDto, SendEmailOtpDto, SelectCompanyDto, UpdateCompanyLegalInfoDto } from '../../../../proxy/dto/profile';
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
import { CompanyLegalInfoService } from '../../../../proxy/profile/company-legal-info.service';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import { environment } from '../../../../../environments/environment';

interface CompanyCard {
  id: number;
  name: string;
  taxId: string;
  address: string;
  employeeRange: string;
  logoBgColor: string;
  logoText?: string;
  logoImage?: string;
  tags: string[];
  raw?: CompanyLegalInfoDto;
  isOwned: boolean;
}

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
    { id: 1, label: 'Xác thực email', completed: false },
    { id: 2, label: 'Cập nhật thông tin công ty', completed: false },
    { id: 3, label: 'Xác thực Giấy đăng ký doanh nghiệp', completed: false }
  ];
  verificationProgressSteps: number = 0;
  isEmailVerified = false;
  isHRStaff: boolean = false; // Flag: tài khoản HR Staff (IsLead = false) hay Leader

  // Company info
  companyTab: string = 'search'; // 'search' or 'create'
  companySearchKeyword: string = '';
  companyList: CompanyCard[] = [];
  isSearchingCompany: boolean = false;
  hasLoadedCompanyList = false;
  selectedCompanyCard: CompanyCard | null = null;
  selectedCompanyDetail: CompanyLegalInfoDto | null = null;
  isLoadingCompanyDetail = false;
  selectedCompanyId: number | null = null; // CompanyId from RecruiterProfile
  
  // Create company form data
  private readonly companyFormDefaults = {
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
  companyFormData = { ...this.companyFormDefaults };
  companyLogoPreview: string | null = null;
  isSavingCompany: boolean = false;
  companyFormErrors: any = {};
  isEditingCompany = false;
  editingCompanyId: number | null = null;
  editingCompanyDetail: CompanyLegalInfoDto | null = null;
  private readonly industrySelectionMap: Record<string, number> = {
    it: 1,
    finance: 2,
    education: 3,
    healthcare: 4,
    retail: 5,
    manufacturing: 6,
    other: 0
  };
  private readonly companyScaleMap: Record<string, number> = {
    '1-9': 9,
    '10-24': 24,
    '25-99': 99,
    '100-499': 499,
    '500+': 500
  };

  // Settings
  cvApplicationNotificationEnabled: boolean = true;

  // Business Registration
  businessCertDocumentType: string = 'business-cert';
  businessCertFile: File | null = null;
  isSavingBusinessCert: boolean = false;
  legalVerificationStatus: string | null = null;
  businessCertDocumentUrl: string | null = null;
  isEditingBusinessCert: boolean = false;

  // Email verification modal
  readonly emailVerificationStepId = 1;
  isEmailVerificationModalOpen = false;
  emailVerification = {
    email: '',
    otp: '',
    isSendingOtp: false,
    isVerifying: false,
    countdown: 0
  };
  private emailVerificationTimer?: any;
  private readonly logoColorPalette = ['#0F83BA', '#2563eb', '#7c3aed', '#14b8a6', '#92400e', '#f97316'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private companyLegalInfoService: CompanyLegalInfoService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private teamManagementService: TeamManagementService
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

    // Xác định HR Staff hay Leader để ẩn/bỏ các phần không được phép
    this.loadCurrentUserRole();
  }

  private loadCurrentUserRole(): void {
    this.teamManagementService.getCurrentUserInfo().subscribe({
      next: (userInfo) => {
        this.isHRStaff = !userInfo.isLead;
      },
      error: (error) => {
        console.error('Error loading user role in recruiter-setting:', error);
        this.isHRStaff = false;
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

        if (this.activeTab === 'company-info') {
          this.ensureCompanyListLoaded();
        }
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
    this.clearEmailVerificationTimer();
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    } else {
      this.sidebarExpanded = false;
    }
    
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
          avatarUrl: ''
        };

        this.isEmailVerified = !!profile.emailConfirmed;
        this.updateEmailVerificationStepStatus(this.isEmailVerified);
        
        // TODO: Check if user is Google user from backend
        // For now, we'll check via userType or a specific field
        // Assuming if userType is 'External' or similar, it's a Google user
        // This is a placeholder - adjust based on your actual backend response
        this.isGoogleUser = profile.userType === 'External' || false;
        // If Google user, assume password not set initially (will be updated after first set)
        // TODO: Add a field in ProfileDto to check if password is set
        this.hasPasswordSet = !this.isGoogleUser || profile.emailConfirmed; // Temporary logic
        
        // Load selected company if CompanyId exists
        this.selectedCompanyId = profile.companyId || null;
        if (this.selectedCompanyId) {
          this.loadSelectedCompany(this.selectedCompanyId);
        }
        
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
          avatarUrl: ''
        };
        // Default to non-Google user if error
        this.isGoogleUser = false;
        this.hasPasswordSet = true;
        this.isEmailVerified = false;
        this.updateEmailVerificationStepStatus(false);
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

    if (tab === 'company-info') {
      this.ensureCompanyListLoaded();
    }
  }

  onSaveProfile(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!this.validateForm()) {
      return false;
    }

    this.isSaving = true;
    
    const nameParts = this.profileData.fullName.trim().split(' ');
    const surname = nameParts.pop() || '';
    const name = nameParts.join(' ') || '';

    const updateDto: UpdatePersonalInfoDto = {
      name,
      surname
    };

    if (this.profileData.email?.trim()) {
      updateDto.email = this.profileData.email.trim();
    }

    if (this.profileData.phone?.trim()) {
      updateDto.phoneNumber = this.profileData.phone.trim();
    }

    // Giới tính đã được bỏ khỏi form, không cần map lên DTO nữa

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
      this.showToastMessage('Họ và tên là bắt buộc', 'error');
      return false;
    }
    if (!this.profileData.email?.trim()) {
      this.showToastMessage('Email là bắt buộc', 'error');
      return false;
    }
    if (!this.profileData.phone?.trim()) {
      this.showToastMessage('Số điện thoại là bắt buộc', 'error');
      return false;
    }
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(this.profileData.phone)) {
      this.showToastMessage('Số điện thoại phải có 10-11 chữ số', 'error');
      return false;
    }
    return true;
  }

  onVerifyEmail() {
    this.openEmailVerificationModal();
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

  onVerificationStepClick(step: { id: number }) {
    if (step.id === this.emailVerificationStepId && !this.isEmailVerified) {
      this.openEmailVerificationModal();
    }
  }

  isEmailVerificationStep(step: { id: number }): boolean {
    return step.id === this.emailVerificationStepId;
  }

  openEmailVerificationModal() {
    this.emailVerification.email = this.profileData.email || '';
    this.emailVerification.otp = '';
    this.emailVerification.isVerifying = false;
    this.isEmailVerificationModalOpen = true;
  }

  closeEmailVerificationModal() {
    this.isEmailVerificationModalOpen = false;
    this.emailVerification.otp = '';
    this.clearEmailVerificationTimer();
  }

  sendEmailVerificationOtp() {
    const email = this.emailVerification.email?.trim();
    if (!email) {
      this.showToastMessage('Vui lòng nhập email', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showToastMessage('Email không hợp lệ', 'error');
      return;
    }

    if (this.emailVerification.isSendingOtp || this.emailVerification.countdown > 0) {
      return;
    }

    this.emailVerification.isSendingOtp = true;

    const payload: SendEmailOtpDto = {
      email: email
    };

    this.profileService.sendEmailOtp(payload).subscribe({
      next: () => {
        this.emailVerification.isSendingOtp = false;
        this.showToastMessage('Đã gửi mã OTP đến email của bạn', 'success');
        this.startEmailVerificationTimer(60);
      },
      error: (error) => {
        this.emailVerification.isSendingOtp = false;
        const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
        this.showToastMessage(errorMessage, 'error');
      }
    });
  }

  submitEmailVerification() {
    const email = this.emailVerification.email?.trim();
    const otp = this.emailVerification.otp?.trim();

    if (!email) {
      this.showToastMessage('Vui lòng nhập email', 'error');
      return;
    }

    if (!otp) {
      this.showToastMessage('Vui lòng nhập mã OTP', 'error');
      return;
    }

    this.emailVerification.isVerifying = true;

    const payload: VerifyEmailNumberDto = {
      email: email,
      otpCode: otp
    };

    this.profileService.verifyEmailNumber(payload).pipe(
      catchError((error) => {
        const errorMessage = error?.error?.error?.message || error?.error?.message || error?.message || 'Xác thực email thất bại';
        if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('has already been changed by another user')) {
          this.handleEmailVerificationSuccess(email);
          return of(null);
        }
        this.emailVerification.isVerifying = false;
        this.showToastMessage(errorMessage, 'error');
        return of(null);
      })
    ).subscribe((result) => {
      if (result === null) {
        return;
      }
      this.handleEmailVerificationSuccess(email);
    });
  }

  private startEmailVerificationTimer(duration: number) {
    this.clearEmailVerificationTimer();
    this.emailVerification.countdown = duration;
    this.emailVerificationTimer = setInterval(() => {
      if (this.emailVerification.countdown <= 1) {
        this.clearEmailVerificationTimer();
        return;
      }
      this.emailVerification.countdown -= 1;
    }, 1000);
  }

  private clearEmailVerificationTimer() {
    if (this.emailVerificationTimer) {
      clearInterval(this.emailVerificationTimer);
      this.emailVerificationTimer = undefined;
    }
    this.emailVerification.countdown = 0;
  }

  private updateEmailVerificationStepStatus(isCompleted: boolean) {
    this.verificationSteps = this.verificationSteps.map(step => {
      if (this.isEmailVerificationStep(step)) {
        return { ...step, completed: isCompleted };
      }
      return step;
    });
    this.updateVerificationProgress();
  }

  private updateCompanyVerificationStepStatus(isCompleted: boolean) {
    this.verificationSteps = this.verificationSteps.map(step => {
      if (step.id === 2) {
        return { ...step, completed: isCompleted };
      }
      return step;
    });
    this.updateVerificationProgress();
  }

  private updateLegalVerificationStepStatus(isCompleted: boolean) {
    this.verificationSteps = this.verificationSteps.map(step => {
      if (step.id === 3) {
        return { ...step, completed: isCompleted };
      }
      return step;
    });
    this.updateVerificationProgress();
  }

  private handleEmailVerificationSuccess(email: string) {
    this.emailVerification.isVerifying = false;
    this.profileData.email = email;
    this.isEmailVerified = true;
    this.updateEmailVerificationStepStatus(true);
    this.showToastMessage('Xác thực email thành công', 'success');
    this.closeEmailVerificationModal();
    this.loadProfileData();
  }

  private updateVerificationProgress() {
    const completed = this.verificationSteps.filter(step => step.completed).length;
    this.verificationProgressSteps = completed;
    this.verificationProgress = Math.round((completed / this.verificationSteps.length) * 100);
    const levelStep = completed === 0 ? 1 : completed;
    this.verificationLevel = `Cấp ${Math.min(levelStep, this.verificationSteps.length)}/3`;

    // Cập nhật trạng thái xác thực toàn hệ thống (dùng cho sidebar, điều hướng, ...)
    if (completed === this.verificationSteps.length) {
      // Hoàn thành 3/3 bước -> tài khoản đã xác thực
      this.navigationService.setVerified(true);
    } else {
      this.navigationService.setVerified(false);
    }
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

    if (tab === 'search') {
      this.ensureCompanyListLoaded();
    } else {
      this.selectedCompanyCard = null;
      this.selectedCompanyDetail = null;
    }
  }

  onSearchCompany(keyword?: string) {
    const searchedKeyword = (keyword ?? this.companySearchKeyword ?? '').trim();
    this.companySearchKeyword = searchedKeyword;
    this.fetchCompanyList(searchedKeyword);
  }

  onSelectCompany(company: any) {
    const card = company as CompanyCard;
    
    // Call API to save CompanyId to RecruiterProfile
    this.profileService.selectCompany({ companyId: card.id }).subscribe({
      next: () => {
        this.selectedCompanyId = card.id;
        this.loadSelectedCompany(card.id);
        this.showToastMessage(`Đã chọn công ty: ${card.name}`, 'success');
      },
      error: (error) => {
        this.showToastMessage('Không thể lưu công ty đã chọn. Vui lòng thử lại.', 'error');
        console.error('Select company failed:', error);
      }
    });
  }

  private loadSelectedCompany(companyId: number) {
    this.selectedCompanyCard = null;
    this.selectedCompanyDetail = null;
    this.isLoadingCompanyDetail = true;

    this.companyLegalInfoService.getCompanyLegalInfo(companyId).subscribe({
      next: (detail) => {
        this.selectedCompanyDetail = detail;
        // Create card from detail
        this.selectedCompanyCard = {
          id: detail.id!,
          name: detail.companyName || 'Chưa cập nhật tên',
          taxId: detail.taxCode || 'Chưa cập nhật',
          address: detail.headquartersAddress || 'Chưa cập nhật',
          employeeRange: this.getEmployeeRange(detail.companySize),
          logoBgColor: this.logoColorPalette[0],
          logoText: this.getLogoInitials(detail.companyName || ''),
          logoImage: this.resolveLogoUrl(detail.logoUrl),
          tags: detail.verificationStatus ? ['Đã xác thực'] : ['Chưa xác thực'],
          raw: detail,
          isOwned: false // Company selected from list, not owned by user
        };
        this.isLoadingCompanyDetail = false;
        this.updateCompanyVerificationStepStatus(true);
        const legalApproved = detail.legalVerificationStatus === 'approved';
        this.legalVerificationStatus = detail.legalVerificationStatus || null;
        this.businessCertDocumentUrl = this.resolveFileUrl(detail.legalDocumentUrl);
        this.isEditingBusinessCert = !this.businessCertDocumentUrl;
        this.updateLegalVerificationStepStatus(legalApproved);
      },
      error: (error) => {
        this.isLoadingCompanyDetail = false;
        this.showToastMessage('Không thể tải thông tin chi tiết công ty.', 'error');
        console.error('Load company detail failed:', error);
        this.updateCompanyVerificationStepStatus(false);
        this.updateLegalVerificationStepStatus(false);
      }
    });
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

  private ensureCompanyListLoaded(force: boolean = false) {
    if (this.companyTab !== 'search') {
      return;
    }

    if (!this.hasLoadedCompanyList || force) {
      this.fetchCompanyList(this.companySearchKeyword);
    }
  }

  private fetchCompanyList(keyword?: string) {
    this.isSearchingCompany = true;

    this.companyLegalInfoService.getCurrentUserCompanyLegalInfoList().subscribe({
      next: (companies) => {
        const filtered = this.filterCompaniesByKeyword(companies || [], keyword);
        this.companyList = filtered.map((company, index) => this.mapCompanyToCard(company, index));
        this.isSearchingCompany = false;
        this.hasLoadedCompanyList = true;

        if (this.companyList.length === 0) {
          const message = keyword
            ? `Không tìm thấy công ty nào khớp với "${keyword}".`
            : 'Chưa có công ty nào được tạo.';
          this.showToastMessage(message, 'info');
        }
      },
      error: (error) => {
        this.isSearchingCompany = false;
        this.showToastMessage('Không thể tải danh sách công ty. Vui lòng thử lại.', 'error');
        console.error('Load company list failed:', error);
      }
    });
  }

  private filterCompaniesByKeyword(companies: CompanyLegalInfoDto[], keyword?: string): CompanyLegalInfoDto[] {
    if (!keyword) {
      return companies;
    }

    const normalizedKeyword = keyword.trim().toLowerCase();
    return companies.filter(company => (company.companyName || '').toLowerCase().includes(normalizedKeyword));
  }

  private mapCompanyToCard(company: CompanyLegalInfoDto, index: number): CompanyCard {
    const name = company.companyName || 'Chưa cập nhật tên';
    const employeeRange = this.getEmployeeRange(company.companySize);
    const tags: string[] = [];

    if (company.verificationStatus !== undefined) {
      tags.push(company.verificationStatus ? 'Đã xác thực' : 'Chưa xác thực');
    }

    if (company.industryId) {
      tags.push(`Ngành #${company.industryId}`);
    }

    return {
      id: company.id!,
      name,
      taxId: company.taxCode || 'Chưa cập nhật',
      address: company.headquartersAddress || 'Chưa cập nhật',
      employeeRange,
      logoBgColor: this.logoColorPalette[index % this.logoColorPalette.length],
      logoText: this.getLogoInitials(name),
      logoImage: this.resolveLogoUrl(company.logoUrl),
      tags,
      raw: company,
      isOwned: this.isCompanyOwned(company)
    };
  }

  private getEmployeeRange(companySize?: number): string {
    if (!companySize || companySize <= 0) {
      return 'Quy mô chưa cập nhật';
    }

    if (companySize < 20) return 'Dưới 20 nhân viên';
    if (companySize < 50) return '20 - 49 nhân viên';
    if (companySize < 100) return '50 - 99 nhân viên';
    if (companySize < 200) return '100 - 199 nhân viên';
    if (companySize < 500) return '200 - 499 nhân viên';
    return '500+ nhân viên';
  }

  private resetCompanyForm() {
    this.companyFormData = { ...this.companyFormDefaults };
    this.companyFormErrors = {};
  }

  private getCompanySizeFromScale(scale: string): number | undefined {
    if (!scale) {
      return undefined;
    }
    if (this.companyScaleMap[scale] !== undefined) {
      return this.companyScaleMap[scale];
    }
    const parsed = parseInt(scale, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  private getScaleSelectionFromSize(size?: number): string {
    if (!size) {
      return '';
    }
    if (size <= 9) return '1-9';
    if (size <= 24) return '10-24';
    if (size <= 99) return '25-99';
    if (size <= 499) return '100-499';
    return '500+';
  }

  private getIndustryIdFromSelection(selection: string, fallback?: number): number | undefined {
    if (!selection) {
      return fallback;
    }
    if (this.industrySelectionMap[selection] !== undefined) {
      return this.industrySelectionMap[selection];
    }
    const parsed = parseInt(selection, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  private getIndustrySelectionFromId(industryId?: number): string {
    if (industryId === undefined || industryId === null) {
      return '';
    }
    const entry = Object.entries(this.industrySelectionMap).find(([, value]) => value === industryId);
    return entry ? entry[0] : 'other';
  }

  private buildUpdateCompanyDtoFromForm(detail: CompanyLegalInfoDto): UpdateCompanyLegalInfoDto {
    const companySize = this.getCompanySizeFromScale(this.companyFormData.scale) ?? detail.companySize ?? 10;
    const industryId = this.getIndustryIdFromSelection(this.companyFormData.industry, detail.industryId);
    const issueDate = detail.businessLicenseIssueDate || new Date().toISOString();

    return {
      companyName: this.companyFormData.companyName || detail.companyName || 'Chưa cập nhật',
      companyCode: detail.companyCode,
      description: this.companyFormData.description || detail.description,
      headquartersAddress: this.companyFormData.address || detail.headquartersAddress || 'Chưa cập nhật',
      contactEmail: this.companyFormData.email || detail.contactEmail || 'contact@example.com',
      contactPhone: this.companyFormData.phone || detail.contactPhone || '0000000000',
      companySize,
      industryId,
      foundedYear: detail.foundedYear ?? new Date().getFullYear(),
      websiteUrl: this.companyFormData.website || detail.websiteUrl || null,
      taxCode: this.companyFormData.taxId || detail.taxCode || '0000000000',
      businessLicenseNumber: detail.businessLicenseNumber || 'Đang cập nhật',
      businessLicenseIssueDate: issueDate,
      businessLicenseIssuePlace: detail.businessLicenseIssuePlace || 'Đang cập nhật',
      legalRepresentative: detail.legalRepresentative || 'Đang cập nhật',
      businessLicenseFile: detail.businessLicenseFile,
      taxCertificateFile: detail.taxCertificateFile,
      representativeIdCardFile: detail.representativeIdCardFile,
      otherSupportFile: detail.otherSupportFile
    };
  }

  private getLogoInitials(name: string): string {
    if (!name) return 'VC';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  private resolveLogoUrl(logoUrl?: string): string | undefined {
    if (!logoUrl) {
      return undefined;
    }

    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }

    const baseUrl = environment.apis?.default?.url || '';
    if (baseUrl && logoUrl.startsWith('/')) {
      return `${baseUrl}${logoUrl}`;
    }

    return logoUrl;
  }

  private isCompanyOwned(company: CompanyLegalInfoDto): boolean {
    const currentEmail = (this.profileData.email || '').trim().toLowerCase();
    const contactEmail = (company.contactEmail || '').trim().toLowerCase();
    return !!currentEmail && currentEmail === contactEmail;
  }

  onEditSelectedCompany() {
    if (!this.selectedCompanyDetail || !this.selectedCompanyDetail.id) {
      this.showToastMessage('Không tìm thấy thông tin chi tiết công ty để chỉnh sửa.', 'error');
      return;
    }

    this.isEditingCompany = true;
    this.editingCompanyId = this.selectedCompanyDetail.id;
    this.editingCompanyDetail = { ...this.selectedCompanyDetail };
    this.companyFormData = {
      ...this.companyFormDefaults,
      companyType: 'enterprise',
      companyName: this.selectedCompanyDetail.companyName || '',
      taxId: this.selectedCompanyDetail.taxCode || '',
      address: this.selectedCompanyDetail.headquartersAddress || '',
      phone: this.selectedCompanyDetail.contactPhone || '',
      email: this.selectedCompanyDetail.contactEmail || '',
      description: this.selectedCompanyDetail.description || '',
      website: this.selectedCompanyDetail.websiteUrl || '',
      scale: this.getScaleSelectionFromSize(this.selectedCompanyDetail.companySize),
      industry: this.getIndustrySelectionFromId(this.selectedCompanyDetail.industryId)
    };
    this.companyFormErrors = {};
    this.companyTab = 'create';
  }

  cancelEditCompany() {
    this.isEditingCompany = false;
    this.editingCompanyId = null;
    this.editingCompanyDetail = null;
    this.companyTab = 'search';
    this.resetCompanyForm();
  }

  get selectedCompanyEmployeeRange(): string {
    if (this.selectedCompanyDetail?.companySize) {
      return this.getEmployeeRange(this.selectedCompanyDetail.companySize);
    }
    return this.selectedCompanyCard?.employeeRange || 'Quy mô chưa cập nhật';
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

    if (this.isEditingCompany && this.editingCompanyId && this.editingCompanyDetail) {
      const updateDto = this.buildUpdateCompanyDtoFromForm(this.editingCompanyDetail);
      this.isSavingCompany = true;
      this.companyLegalInfoService.updateCompanyLegalInfo(this.editingCompanyId, updateDto).subscribe({
        next: () => {
          this.isSavingCompany = false;
          this.showToastMessage('Cập nhật thông tin công ty thành công! Hồ sơ đang chờ xác thực lại từ phía Employee.', 'success');
          this.isEditingCompany = false;
          this.companyTab = 'search';
          const companyId = this.selectedCompanyId ?? this.editingCompanyId;
          this.editingCompanyId = null;
          this.editingCompanyDetail = null;
          this.resetCompanyForm();
          if (companyId) {
            this.loadSelectedCompany(companyId);
          }
        },
        error: (error) => {
          this.isSavingCompany = false;
          const message = error?.error?.error?.message || 'Không thể cập nhật thông tin công ty.';
          this.showToastMessage(message, 'error');
        }
      });
      return;
    }

    this.isSavingCompany = true;

    // TODO: Call API to save company
    setTimeout(() => {
      this.isSavingCompany = false;
      this.showToastMessage('Tạo công ty thành công!', 'success');
      this.resetCompanyForm();
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

    if (!this.selectedCompanyId) {
      this.showToastMessage('Không tìm thấy công ty để nộp giấy tờ. Vui lòng kiểm tra lại thông tin công ty.', 'error');
      return;
    }

    this.isSavingBusinessCert = true;

    const formData = new FormData();
    formData.append('file', this.businessCertFile);

    const apiUrl = `${environment.apis.default.url}/api/profile/company-legal-info/${this.selectedCompanyId}/upload-legal-document`;

    this.http.post<any>(apiUrl, formData, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        this.isSavingBusinessCert = false;

        let updatedCompany: any = null;
        if (response && response.result) {
          updatedCompany = response.result;
        } else if (response && response.value) {
          updatedCompany = response.value;
        } else {
          updatedCompany = response;
        }

        if (updatedCompany) {
          this.selectedCompanyDetail = updatedCompany;
          this.legalVerificationStatus = updatedCompany.legalVerificationStatus || null;
          const legalApproved = updatedCompany.legalVerificationStatus === 'approved';
          this.businessCertDocumentUrl = this.resolveFileUrl(updatedCompany.legalDocumentUrl);
          this.isEditingBusinessCert = false;
          this.businessCertFile = null;
          this.updateLegalVerificationStepStatus(legalApproved);
        }

        this.showToastMessage('Nộp Giấy đăng ký doanh nghiệp thành công! Hồ sơ đang chờ duyệt.', 'success');
      },
      error: (error) => {
        this.isSavingBusinessCert = false;
        console.error('Upload legal document failed:', error);

        let errorMessage = 'Không thể nộp Giấy đăng ký doanh nghiệp. Vui lòng thử lại.';
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.showToastMessage(errorMessage, 'error');
      }
    });
  }

  onEditBusinessCert() {
    this.isEditingBusinessCert = true;
    this.businessCertFile = null;
  }

  onCancelBusinessCert() {
    this.isEditingBusinessCert = false;
    this.businessCertFile = null;
  }

  private resolveFileUrl(path?: string | null): string | null {
    if (!path) {
      return null;
    }

    // Nếu backend đã trả về full URL thì dùng luôn
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Mặc định: gọi qua API download để stream file từ storage
    const apiBase = environment.apis.default.url;
    const encodedPath = encodeURIComponent(path);
    return `${apiBase}/api/profile/company-legal-info/legal-document?storagePath=${encodedPath}`;
  }
}

