import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProfileService, UpdatePersonalInfoDto, ProfileDto } from '../../../../proxy/api/profile.service';
// import { FormInputComponent, FileUploadComponent } from '../../../shared/components';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './candidate-profile.component.html',
  styleUrls: ['./candidate-profile.component.scss']
})
export class CandidateProfileComponent implements OnInit {
  // Trạng thái component
  isLoading: boolean = false;
  isSaving: boolean = false;
  isUploadingAvatar: boolean = false;

  // Dữ liệu profile
  profileData = {
    fullName: 'Uông Hoàng Duy',
    email: 'duyuong0273@gmail.com',
    phone: '0966211316',
    dateOfBirth: '1995-03-15',
    gender: 'male',
    address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    country: 'Việt Nam',
    bio: 'Tôi là một developer có kinh nghiệm với 5 năm làm việc trong lĩnh vực công nghệ thông tin. Tôi có đam mê với việc phát triển các ứng dụng web hiện đại và luôn tìm kiếm những thách thức mới.',
    website: 'https://nguyenvana.com',
    linkedin: 'https://linkedin.com/in/nguyenvana',
    github: 'https://github.com/nguyenvana',
    avatarUrl: ''
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

  constructor(private router: Router, private http: HttpClient, private profileService: ProfileService) {}

  ngOnInit() {
    // Load profile data từ API hoặc localStorage
    this.loadProfileData();
  }

  loadProfileData() {
    this.isLoading = true;
    
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile: ProfileDto) => {
        // Map backend ProfileDto to frontend profileData
        this.profileData = {
          fullName: `${profile.name || ''} ${profile.surname || ''}`.trim(),
          email: profile.email || '',
          phone: profile.phoneNumber || '',
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: profile.gender ? 'male' : 'female', // Convert boolean to string
          address: profile.address || profile.location || '',
          city: profile.location || '',
          country: 'Việt Nam', // Default value
          bio: profile.bio || '',
          website: '',
          linkedin: '',
          github: '',
          avatarUrl: ''
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
        this.showErrorMessage('Không thể tải thông tin profile');
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
    
    // Map frontend profileData to backend UpdatePersonalInfoDto
    const updateData: UpdatePersonalInfoDto = {
      name: profileData.fullName.split(' ')[0] || '',
      surname: profileData.fullName.split(' ').slice(1).join(' ') || '',
      email: profileData.email,
      phoneNumber: profileData.phone,
      bio: profileData.bio,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
      gender: profileData.gender === 'male' ? true : false, // Convert string to boolean
      location: profileData.location || profileData.address
    };
    
    this.profileService.updatePersonalInfo(updateData).subscribe({
      next: (updatedProfile: ProfileDto) => {
        // Update local profileData with response
        this.profileData = {
          ...this.profileData,
          fullName: `${updatedProfile.name || ''} ${updatedProfile.surname || ''}`.trim(),
          email: updatedProfile.email || '',
          phone: updatedProfile.phoneNumber || '',
          dateOfBirth: updatedProfile.dateOfBirth ? new Date(updatedProfile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: updatedProfile.gender ? 'male' : 'female',
          address: updatedProfile.address || updatedProfile.location || '',
          bio: updatedProfile.bio || ''
        };
        this.showSuccessMessage('Cập nhật thông tin thành công!');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.isSaving = false;
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

  onAvatarChange(file: File) {
    this.isUploadingAvatar = true;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    this.http.post('/api/profile/avatar', formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.profileData.avatarUrl = response.data.avatarUrl;
          this.showSuccessMessage(response.message);
        }
        this.isUploadingAvatar = false;
      },
      error: (error) => {
        console.error('Error uploading avatar:', error);
        this.isUploadingAvatar = false;
        this.showErrorMessage('Có lỗi xảy ra khi upload ảnh đại diện');
      }
    });
  }

  onAvatarRemove() {
    this.profileData.avatarUrl = '';
    this.showSuccessMessage('Ảnh đại diện đã được xóa!');
  }

  onCvUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('cv', file);
      
      this.http.post('/api/profile/cv', formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cvFileName = response.data.fileName;
            this.showSuccessMessage(response.message);
          }
        },
        error: (error) => {
          console.error('Error uploading CV:', error);
          this.showErrorMessage('Có lỗi xảy ra khi upload CV');
        }
      });
    }
  }

  // Avatar modal methods
  openAvatarModal() {
    this.showAvatarModal = true;
    this.selectedImage = '';
    this.previewImage = this.profileData.avatarUrl;
  }

  closeAvatarModal(event: any) {
    if (event.target === event.currentTarget) {
      this.showAvatarModal = false;
    }
  }

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

  saveAvatar() {
    if (this.previewImage) {
      // Tạo file từ base64 image
      const file = this.dataURLtoFile(this.previewImage, 'avatar.jpg');
      this.onAvatarChange(file);
    }
    this.showAvatarModal = false;
  }

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
