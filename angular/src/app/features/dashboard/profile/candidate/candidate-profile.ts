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
    address: ''
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
            address: ''
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
          address: response.address || ''
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
          address: ''
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
    const nameParts = profileData.fullName.trim().split(' ');
    const surname = nameParts.pop() || '';
    const name = nameParts.join(' ') || '';

    const updateDto: UpdatePersonalInfoDto = {
      name: name,
      surname: surname,
      phoneNumber: profileData.phone,
      address: profileData.address,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender === 'male' ? true : profileData.gender === 'female' ? false : undefined
    };
    
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
