import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UploadedCvService } from '../../../../core/services/uploaded-cv.service';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import type { ProfileDto, UpdatePersonalInfoDto } from '../../../../proxy/profile/models';
import { EnableJobSearchModalComponent } from '../../../../shared/components/enable-job-search-modal/enable-job-search-modal';
import { ProfilePictureEditModal } from '../../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EnableJobSearchModalComponent,
    ProfilePictureEditModal
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
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;
  showEnableJobSearchModal: boolean = false;

  // Profile Picture Modal
  showProfilePictureModal: boolean = false;

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
    
    // Gọi bằng native fetch để loại trừ toàn bộ Http Interceptor
    fetch(`${environment.apis.default.url}/api/profile`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      redirect: 'follow',
      mode: 'cors'
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
        }
        return res.json() as Promise<ProfileDto>;
      })
      .then((response: ProfileDto) => {
        // Kiểm tra nếu response rỗng hoặc null
        if (!response) {
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
        
        this.isLoading = false;
      })
      .catch((error) => {
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
    
    this.profileService.updatePersonalInfo(updateDto).subscribe({
      next: (response) => {
        this.showSuccessMessage('Cập nhật thông tin thành công!');
        this.loadProfileData(); // Reload data
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

  // Profile Picture Modal methods
  openProfilePictureModal() {
    this.showProfilePictureModal = true;
  }

  openAvatarModal() {
    this.openProfilePictureModal();
  }

  closeProfilePictureModal() {
    this.showProfilePictureModal = false;
  }

  onProfilePictureChange() {
    this.showSuccessMessage('Đã cập nhật ảnh đại diện thành công');
    this.closeProfilePictureModal();
  }

  onProfilePictureDelete() {
    this.showSuccessMessage('Đã xóa ảnh đại diện thành công');
    this.closeProfilePictureModal();
  }

  // Enable Job Search Modal methods (keep existing logic)
  onToggleJobSearch() {
    // Nếu đang bật (toggle từ ON sang OFF), chỉ cần tắt
    if (this.jobSearchEnabled) {
      this.jobSearchEnabled = false;
    } else {
      // Nếu đang tắt (toggle từ OFF sang ON), mở modal để chọn CV
      this.showEnableJobSearchModal = true;
    }
  }

  // Wrapper for new UI that uses event
  onJobSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Keep existing logic but handle event
    if (target.checked) {
      // Nếu đang tắt (toggle từ OFF sang ON), mở modal để chọn CV
      this.showEnableJobSearchModal = true;
      // Reset checkbox vì modal sẽ xử lý
      target.checked = false;
      this.jobSearchEnabled = false;
    } else {
      // Nếu đang bật (toggle từ ON sang OFF), chỉ cần tắt
      this.jobSearchEnabled = false;
    }
  }

  onAllowRecruiterSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.allowRecruiterSearch = target.checked;
    // Keep existing logic - no message for this one
  }

  onCloseEnableJobSearchModal() {
    this.showEnableJobSearchModal = false;
  }

  onEnableJobSearch(selectedCvIds: string[]) {
    // Xử lý logic bật tìm việc với các CV đã chọn
    // TODO: Gọi API để bật tìm việc với các CV đã chọn
    this.jobSearchEnabled = true;
    this.showSuccessMessage('Đã bật tìm việc thành công!');
  }
}
