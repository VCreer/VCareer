import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UploadedCvService } from '../../../../core/services/uploaded-cv.service';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import type { ProfileDto, UpdatePersonalInfoDto } from '../../../../proxy/profile/models';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './candidate-profile.html',
  styleUrls: ['./candidate-profile.scss']
})
export class CandidateProfileComponent implements OnInit {
  // Trạng thái component
  isLoading: boolean = false;
  isSaving: boolean = false;
  isUploadingAvatar: boolean = false;

  // Dữ liệu profile
  profileData = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '', // Địa chỉ (có thể map từ location)
    location: '' // Location từ CandidateProfile
  };

  // Settings
  topConnectEnabled: boolean = true;
  cvFileName: string = '';

  // Avatar modal
  showAvatarModal: boolean = false;
  selectedImage: string = '';
  previewImage: string = '';

  // Validation
  errors: any = {};

  constructor(
    private router: Router,
    private profileService: ProfileService,
    private uploadedCvService: UploadedCvService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Load profile data từ API
    this.loadProfileData();
  }

  loadProfileData() {
    this.isLoading = true;
    
    // Lấy token từ localStorage
    // Login component lưu token với key 'access_token'
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No token found in localStorage');
      this.showErrorMessage('Vui lòng đăng nhập lại');
      this.isLoading = false;
      this.router.navigate(['/candidate/login']);
      return;
    }

    // Sử dụng HttpClient trực tiếp để đảm bảo token được thêm vào headers
    const apiUrl = `${environment.apis.default.url}/api/profile`;
    this.http.get<ProfileDto>(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: ProfileDto) => {
        console.log('Profile data from API:', response);
        
        // Kiểm tra nếu response rỗng hoặc null
        if (!response) {
          console.warn('No profile data returned from API');
          this.profileData = {
            fullName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            gender: '',
            address: '',
            location: ''
          };
          this.isLoading = false;
          return;
        }
        
        // Map dữ liệu từ API về form
        this.profileData = {
          fullName: `${response.name || ''} ${response.surname || ''}`.trim() || 'User',
          email: response.email || '',
          phone: response.phoneNumber || '',
          dateOfBirth: response.dateOfBirth ? response.dateOfBirth.split('T')[0] : '',
          gender: response.gender === true ? 'male' : (response.gender === false ? 'female' : ''),
          address: response.location || response.address || '', // Map location từ CandidateProfile vào address field
          location: response.location || '' // Giữ location riêng để gửi lên update
        };
        
        console.log('Mapped profile data:', this.profileData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        
        // Nếu lỗi 401 Unauthorized, chuyển đến trang login
        if (error.status === 401 || error.status === 403) {
          this.showErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          // Xóa cả 2 keys để đảm bảo
          localStorage.removeItem('access_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          this.router.navigate(['/candidate/login']);
          return;
        }
        
        // Load default data if API fails
        this.profileData = {
          fullName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          location: ''
        };
        this.isLoading = false;
        this.showErrorMessage('Không thể tải thông tin profile. Vui lòng thử lại sau.');
      }
    });
  }

  onCancelEdit() {
    // Reset form về trạng thái ban đầu
    this.loadProfileData();
  }

  onSaveProfile(profileData: any) {
    // Validate form
    if (!this.validateForm()) {
      this.showErrorMessage('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    this.isSaving = true;
    
    // Lấy token từ localStorage
    // Login component lưu token với key 'access_token'
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    
    if (!token) {
      this.showErrorMessage('Vui lòng đăng nhập lại');
      this.isSaving = false;
      this.router.navigate(['/candidate/login']);
      return;
    }
    
    // Parse fullName to name and surname
    // Đảm bảo name và surname không rỗng (required fields)
    const nameParts = profileData.fullName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0) {
      this.showErrorMessage('Họ và tên không được để trống');
      this.isSaving = false;
      return;
    }
    
    // Nếu chỉ có 1 từ, đặt vào cả name và surname để đảm bảo cả 2 đều có giá trị
    let name = '';
    let surname = '';
    if (nameParts.length === 1) {
      name = nameParts[0];
      surname = nameParts[0];
    } else {
      surname = nameParts.pop() || '';
      name = nameParts.join(' ').trim() || '';
    }

    // Đảm bảo name và surname không rỗng sau khi parse
    if (!name || !surname) {
      this.showErrorMessage('Không thể parse họ và tên. Vui lòng nhập đầy đủ họ và tên.');
      this.isSaving = false;
      return;
    }

    // Format dateOfBirth: nếu có giá trị, chuyển sang ISO 8601 format
    let formattedDateOfBirth: string | undefined = undefined;
    if (profileData.dateOfBirth) {
      try {
        const date = new Date(profileData.dateOfBirth);
        if (!isNaN(date.getTime())) {
          formattedDateOfBirth = date.toISOString();
        }
      } catch (e) {
        console.warn('Invalid date format:', profileData.dateOfBirth);
      }
    }

    // Build DTO - CHỈ gửi các fields có trong UI và có giá trị
    // KHÔNG gửi: bio, nationality, maritalStatus (không có trong UI)
    const updateDto: any = {
      name: name.trim(),
      surname: surname.trim()
    };

    // Chỉ thêm optional fields nếu có giá trị
    if (profileData.email?.trim() && profileData.email.trim().length > 0) {
      updateDto.email = profileData.email.trim();
    }

    if (profileData.phone?.trim() && profileData.phone.trim().length > 0) {
      updateDto.phoneNumber = profileData.phone.trim();
    }

    if (profileData.address?.trim() && profileData.address.trim().length > 0) {
      // Location: map từ address field (vì CandidateProfile dùng Location, không dùng Address)
      updateDto.location = profileData.address.trim();
      // Address field (optional - không có trong CandidateProfile nhưng có thể dùng cho tương lai)
      updateDto.address = profileData.address.trim();
    } else if (profileData.location?.trim() && profileData.location.trim().length > 0) {
      updateDto.location = profileData.location.trim();
    }

    if (formattedDateOfBirth) {
      updateDto.dateOfBirth = formattedDateOfBirth;
    }

    if (profileData.gender === 'male' || profileData.gender === 'female') {
      updateDto.gender = profileData.gender === 'male' ? true : false;
    }

    // KHÔNG gửi các fields không có trong UI:
    // - bio (không có trong form)
    // - nationality (không có trong form)
    // - maritalStatus (không có trong form)
    
    console.log('Sending update DTO:', JSON.stringify(updateDto, null, 2));
    
    // Sử dụng HttpClient trực tiếp để đảm bảo token được thêm vào headers
    const apiUrl = `${environment.apis.default.url}/api/profile/personal-info`;
    this.http.put(apiUrl, updateDto, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response) => {
        this.showSuccessMessage('Cập nhật thông tin thành công!');
        this.loadProfileData(); // Reload data
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        console.error('Error details:', error.error);
        this.isSaving = false;
        
        // Nếu lỗi 401 Unauthorized, chuyển đến trang login
        if (error.status === 401 || error.status === 403) {
          this.showErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          // Xóa cả 2 keys để đảm bảo
          localStorage.removeItem('access_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          this.router.navigate(['/candidate/login']);
          return;
        }
        
        // Xử lý lỗi 400 Bad Request với validation errors
        if (error.status === 400) {
          let errorMessage = 'Có lỗi xảy ra khi lưu thông tin';
          
          console.error('Validation error response:', error.error);
          
          if (error.error) {
            // ASP.NET Core ValidationProblemDetails format
            if (error.error.errors) {
              // ModelState validation errors
              const validationErrors: string[] = [];
              Object.keys(error.error.errors).forEach(key => {
                const fieldErrors = error.error.errors[key];
                if (Array.isArray(fieldErrors)) {
                  fieldErrors.forEach((err: string) => {
                    validationErrors.push(`${key}: ${err}`);
                  });
                } else {
                  validationErrors.push(`${key}: ${fieldErrors}`);
                }
              });
              
              if (validationErrors.length > 0) {
                errorMessage = 'Lỗi validation:\n' + validationErrors.join('\n');
                console.error('Validation errors:', validationErrors);
              }
            }
            // ABP Framework format
            else if (error.error.error?.details) {
              const details = error.error.error.details;
              if (Array.isArray(details) && details.length > 0) {
                errorMessage = details.map((d: any) => d.message || d).join('\n');
              }
            } else if (error.error.error?.message) {
              errorMessage = error.error.error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.title) {
              errorMessage = error.error.title;
              if (error.error.detail) {
                errorMessage += ': ' + error.error.detail;
              }
            }
          }
          
          this.showErrorMessage(errorMessage);
          return;
        }
        
        this.showErrorMessage('Có lỗi xảy ra khi lưu thông tin');
      }
    });
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Validate required fields
    if (!this.profileData.fullName?.trim()) {
      this.errors.fullName = 'Họ và tên là bắt buộc';
      isValid = false;
    }

    if (!this.profileData.address?.trim()) {
      this.errors.address = 'Địa chỉ là bắt buộc';
      isValid = false;
    }

    if (!this.profileData.dateOfBirth) {
      this.errors.dateOfBirth = 'Ngày sinh là bắt buộc';
      isValid = false;
    }

    if (!this.profileData.gender) {
      this.errors.gender = 'Giới tính là bắt buộc';
      isValid = false;
    }

    // Validate phone number
    if (!this.profileData.phone?.trim()) {
      this.errors.phone = 'Số điện thoại là bắt buộc';
      isValid = false;
    } else {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(this.profileData.phone)) {
        this.errors.phone = 'Số điện thoại phải có 10-11 chữ số';
        isValid = false;
      }
    }

    return isValid;
  }

  // Removed avatar and CV upload functionality as per user request

  // Avatar modal methods
  // openAvatarModal() {
  //   this.showAvatarModal = true;
  //   this.selectedImage = '';
  //   this.previewImage = this.profileData.avatarUrl;
  // }

  // closeAvatarModal(event: any) {
  //   if (event.target === event.currentTarget) {
  //     this.showAvatarModal = false;
  //   }
  // }

  triggerFileInput() {
    document.getElementById('avatar-input')?.click();
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
        this.previewImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  deleteImage() {
    this.selectedImage = '';
    this.previewImage = '';
  }

  // saveAvatar() {
  //   if (this.previewImage) {
  //     // Tạo file từ base64 image
  //     const file = this.dataURLtoFile(this.previewImage, 'avatar.jpg');
  //     this.onAvatarChange(file);
  //   }
  //   this.showAvatarModal = false;
  // }

  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  cancelAvatarEdit() {
    this.showAvatarModal = false;
    this.selectedImage = '';
    this.previewImage = '';
  }

  onBackToProfile() {
    this.router.navigate(['/candidate/dashboard']);
  }

  onSaveChanges() {
    // Trigger form submission
    const formElement = document.querySelector('app-profile-form form');
    if (formElement) {
      (formElement as HTMLFormElement).requestSubmit();
    }
  }

  get fullName() {
    return this.profileData.fullName;
  }

  private showSuccessMessage(message: string) {
    // Tạo toast notification
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private showErrorMessage(message: string) {
    // Tạo toast notification
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
