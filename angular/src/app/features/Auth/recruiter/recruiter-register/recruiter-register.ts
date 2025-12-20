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
  ToastNotificationComponent,
  SelectFieldComponent,
  SelectOption
} from '../../../../shared/components';
import { AuthService } from '../../../../proxy/services/auth/auth.service';
import { RecruiterRegisterDto } from '../../../../proxy/dto/auth-dto/models';
import { GeoService } from '../../../../proxy/services/geo/geo.service';
import { ProvinceDto, WardDto } from '../../../../proxy/dto/geo-dto/models';
import { CompanyLegalInfoService } from '../../../../proxy/profile/company-legal-info.service';
import { SubmitCompanyLegalInfoDto } from '../../../../proxy/dto/profile/models';

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
    ToastNotificationComponent,
    SelectFieldComponent
  ]
})
export class RecruiterRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private googleAuthService = inject(GoogleAuthService);
  private authService = inject(AuthService);
  private geoService = inject(GeoService);
  private companyLegalInfoService = inject(CompanyLegalInfoService);

  registerForm!: FormGroup;
  isLoading = false;
  submitAttempted = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'error';

  // Options for select fields
  genderOptions: SelectOption[] = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' }
  ];

  // Placeholder for city/district - sẽ cần load từ API
  cityOptions: SelectOption[] = [];
  districtOptions: SelectOption[] = [];

  // Lưu thông tin công ty từ API thông tin doanh nghiệp
  companyInfoFromApi: any = null;

  ngOnInit(): void {
    this.initializeForm();
    this.googleAuthService.initialize();
    this.loadProvinces();
    
    // Load districts when city changes
    this.registerForm.get('city')?.valueChanges.subscribe(cityCode => {
      if (cityCode) {
        this.loadDistrictsByProvince(Number(cityCode));
      } else {
        this.districtOptions = [];
        this.registerForm.get('district')?.setValue('');
      }
    });
  }

  private loadProvinces(): void {
    this.geoService.getProvinces().subscribe({
      next: (provinces: ProvinceDto[]) => {
        this.cityOptions = provinces.map(p => ({
          value: p.code?.toString() || '',
          label: p.name || ''
        }));
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
        // Tạm thời tạo options mẫu nếu API lỗi
        this.cityOptions = [
          { value: '1', label: 'Hà Nội' },
          { value: '2', label: 'Hồ Chí Minh' },
          { value: '3', label: 'Đà Nẵng' }
        ];
      }
    });
  }

  private loadDistrictsByProvince(provinceCode: number): void {
    this.geoService.getProvinces().subscribe({
      next: (provinces: ProvinceDto[]) => {
        const province = provinces.find(p => p.code === provinceCode);
        if (province && province.wards) {
          // Sử dụng wards như districts
          this.districtOptions = province.wards.map(w => ({
            value: w.code?.toString() || '',
            label: w.name || ''
          }));
        } else {
          this.districtOptions = [];
        }
        // Reset district value when province changes
        this.registerForm.get('district')?.setValue('');
      },
      error: (error) => {
        console.error('Error loading districts:', error);
        this.districtOptions = [];
      }
    });
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
   * Async validator để kiểm tra mã số thuế qua API thông tin doanh nghiệp
   * Nếu mã số thuế tồn tại, lưu thông tin công ty để dùng sau khi đăng ký
   */
  private taxCodeValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const taxCode = control.value?.trim();
      
      // Nếu chưa nhập hoặc không hợp lệ format, không validate
      if (!taxCode || !/^\d{10}$|^\d{13}$/.test(taxCode)) {
        this.companyInfoFromApi = null;
        return of(null);
      }

      // Debounce 500ms để tránh gọi API quá nhiều khi user đang gõ
      return timer(500).pipe(
        switchMap(() => {
          // Gọi backend proxy endpoint để tránh CORS
          const baseUrl = environment.apis?.default?.url || 'https://localhost:44385';
          const apiUrl = `${baseUrl}/api/app/tax-code/company-info/${taxCode}`;
          return this.http.get<any>(apiUrl).pipe(
            map(response => {
              console.log('Tax code API response:', response);
              
              // Kiểm tra nhiều trường hợp response có thể có
              // 1. Response trực tiếp có Title
              if (response && response.Title) {
                this.companyInfoFromApi = response;
                if (!this.registerForm.get('companyName')?.value) {
                  this.registerForm.get('companyName')?.setValue(response.Title);
                }
                return null; // Hợp lệ
              }
              
              // 2. Response có LtsItems (danh sách công ty)
              if (response && response.LtsItems && Array.isArray(response.LtsItems) && response.LtsItems.length > 0) {
                const companyInfo = response.LtsItems[0];
                if (companyInfo && companyInfo.Title) {
                  this.companyInfoFromApi = companyInfo;
                  if (!this.registerForm.get('companyName')?.value) {
                    this.registerForm.get('companyName')?.setValue(companyInfo.Title);
                  }
                  return null; // Hợp lệ
                }
              }
              
              // 3. Response có MaSoThue (mã số thuế) - đây là dấu hiệu hợp lệ
              if (response && response.MaSoThue) {
                this.companyInfoFromApi = response;
                if (!this.registerForm.get('companyName')?.value && response.Title) {
                  this.registerForm.get('companyName')?.setValue(response.Title);
                }
                return null; // Hợp lệ
              }
              
              // 4. Response có raw content (nếu backend không parse được)
              if (response && response.raw) {
                try {
                  const parsed = JSON.parse(response.raw);
                  if (parsed && (parsed.Title || parsed.MaSoThue)) {
                    this.companyInfoFromApi = parsed;
                    if (!this.registerForm.get('companyName')?.value && parsed.Title) {
                      this.registerForm.get('companyName')?.setValue(parsed.Title);
                    }
                    return null; // Hợp lệ
                  }
                } catch (e) {
                  console.warn('Cannot parse raw response:', e);
                }
              }
              
              // Không tìm thấy thông tin công ty hợp lệ
              console.warn('Invalid company info response structure:', response);
              this.companyInfoFromApi = null;
              return { taxCodeInvalid: true };
            }),
            catchError((error) => {
              // Nếu API lỗi (404 hoặc lỗi khác), coi như mã số thuế không tồn tại
              console.error('Error calling tax code API:', taxCode, error);
              console.error('Error details:', error.error, error.status, error.statusText);
              this.companyInfoFromApi = null;
              
              // Nếu là 404, rõ ràng là không tìm thấy
              if (error.status === 404) {
                return of({ taxCodeInvalid: true });
              }
              
              // Các lỗi khác, có thể là network issue, nhưng vẫn báo không hợp lệ để user biết
              return of({ taxCodeInvalid: true });
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
      return 'Mã số thuế không tồn tại hoặc không hợp lệ';
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

    // Hiển thị lỗi nếu form không valid
    if (!this.registerForm.valid) {
      const invalidFields: string[] = [];
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control && control.invalid) {
          invalidFields.push(this.getFieldLabel(key));
        }
      });
      
      if (invalidFields.length > 0) {
        this.showToastMessage(
          `Vui lòng điền đầy đủ thông tin. Các trường còn thiếu: ${invalidFields.join(', ')}`,
          'error'
        );
      }
      return;
    }

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
        // Nếu có thông tin công ty từ API, tự động submit
        if (this.companyInfoFromApi) {
          this.submitCompanyInfoFromApi();
        } else {
          this.isLoading = false;
          this.showToastMessage('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');
          setTimeout(() => {
            this.router.navigate(['/recruiter/login']);
          }, 2000);
        }
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

  navigateToLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  goToLogin() {
    this.router.navigate(['/recruiter/login']);
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

  /**
   * Submit thông tin công ty từ API thông tin doanh nghiệp
   */
  private submitCompanyInfoFromApi(): void {
    if (!this.companyInfoFromApi) {
      this.isLoading = false;
      this.showToastMessage('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');
      setTimeout(() => {
        this.router.navigate(['/recruiter/login']);
      }, 2000);
      return;
    }

    const apiData = this.companyInfoFromApi;
    const formData = this.registerForm.value;

    // Map dữ liệu từ API sang SubmitCompanyLegalInfoDto
    // Lấy các giá trị từ API, fallback về form data hoặc giá trị mặc định
    const companyDto: SubmitCompanyLegalInfoDto = {
      // Bắt buộc
      companyName: apiData.Title || formData.companyName?.trim() || 'Công ty chưa có tên',
      headquartersAddress: apiData.DiaChiCongTy || formData.companyName?.trim() || 'Chưa có địa chỉ',
      contactPhone: apiData.NoiDangKyQuanLy_DienThoai || apiData.NoiNopThue_DienThoai || formData.phone?.trim() || '',
      contactEmail: formData.email?.trim() || '',
      taxCode: apiData.MaSoThue || formData.taxCode?.trim() || '',
      businessLicenseNumber: apiData.GiayPhepKinhDoanh || apiData.MaSoThue || formData.taxCode?.trim() || '',
      businessLicenseIssuePlace: apiData.GiayPhepKinhDoanh_CoQuanCapTitle || apiData.TinhThanhTitle || 'Chưa có thông tin',
      legalRepresentative: apiData.ChuSoHuu || 'Chưa có thông tin',
      
      // Tùy chọn
      businessLicenseIssueDate: apiData.GiayPhepKinhDoanh_NgayCap ? new Date(apiData.GiayPhepKinhDoanh_NgayCap).toISOString() : undefined,
      companySize: apiData.TongSoLaoDong ? Number(apiData.TongSoLaoDong) : undefined,
      foundedYear: apiData.NgayCap ? new Date(apiData.NgayCap).getFullYear() : undefined,
      description: apiData.NganhNgheTitle || undefined,
      companyCode: apiData.MaSoThue || formData.taxCode?.trim() || undefined,
    };

    this.companyLegalInfoService.submitCompanyLegalInfo(companyDto).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToastMessage('Đăng ký thành công! Thông tin công ty đã được cập nhật tự động.', 'success');
        setTimeout(() => {
          this.router.navigate(['/recruiter/login']);
        }, 2000);
      },
      error: (error) => {
        // Nếu submit company info lỗi, vẫn cho phép đăng nhập (đã đăng ký thành công)
        console.warn('Cannot submit company info, but registration is successful:', error);
        this.isLoading = false;
        this.showToastMessage('Đăng ký thành công! Bạn có thể cập nhật thông tin công ty sau.', 'success');
        setTimeout(() => {
          this.router.navigate(['/recruiter/login']);
        }, 2000);
      },
    });
  }
}
