import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UploadedCvService } from '../../../../core/services/uploaded-cv.service';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import type { ProfileDto } from '../../../../proxy/dto/profile/models';
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
  isLoading = false;
  isSaving = false;
  isUploadingAvatar = false;

  profileData = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    location: ''
  };

  topConnectEnabled = true;
  cvFileName = '';
  jobSearchEnabled = false;
  allowRecruiterSearch = true;
  showEnableJobSearchModal = false;
  showProfilePictureModal = false;
  errors: any = {};

  constructor(
    private router: Router,
    private profileService: ProfileService,
    private uploadedCvService: UploadedCvService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    this.isLoading = true;
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    if (!token) {
      this.showErrorMessage('Vui lòng đăng nhập lại');
      this.isLoading = false;
      this.router.navigate(['/candidate/login']);
      return;
    }

    const apiUrl = `${environment.apis.default.url}/api/profile`;
    this.http.get<ProfileDto>(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).subscribe({
      next: (response) => {
        if (!response) {
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

        this.profileData = {
          fullName: `${response.name || ''} ${response.surname || ''}`.trim() || 'User',
          email: response.email || '',
          phone: response.phoneNumber || '',
          dateOfBirth: response.dateOfBirth ? response.dateOfBirth.split('T')[0] : '',
          gender: response.gender === true ? 'male' : (response.gender === false ? 'female' : ''),
          address: response.location || response.address || '',
          location: response.location || ''
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        if (error.status === 401 || error.status === 403) {
          this.showErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          localStorage.removeItem('access_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          this.router.navigate(['/candidate/login']);
          return;
        }
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
    this.loadProfileData();
  }

  onSaveProfile(profileData: any) {
    if (!this.validateForm()) {
      this.showErrorMessage('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    this.isSaving = true;
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    if (!token) {
      this.showErrorMessage('Vui lòng đăng nhập lại');
      this.isSaving = false;
      this.router.navigate(['/candidate/login']);
      return;
    }

    const nameParts = profileData.fullName.trim().split(' ').filter(x => x.length > 0);
    let name = '', surname = '';
    if (nameParts.length === 1) {
      name = surname = nameParts[0];
    } else {
      surname = nameParts.pop() || '';
      name = nameParts.join(' ');
    }

    let formattedDateOfBirth: string | undefined;
    if (profileData.dateOfBirth) {
      const date = new Date(profileData.dateOfBirth);
      if (!isNaN(date.getTime())) formattedDateOfBirth = date.toISOString();
    }

    const updateDto: any = { name, surname };
    if (profileData.email?.trim()) updateDto.email = profileData.email.trim();
    if (profileData.phone?.trim()) updateDto.phoneNumber = profileData.phone.trim();
    if (profileData.address?.trim()) {
      updateDto.location = profileData.address.trim();
      updateDto.address = profileData.address.trim();
    } else if (profileData.location?.trim()) updateDto.location = profileData.location.trim();
    if (formattedDateOfBirth) updateDto.dateOfBirth = formattedDateOfBirth;
    if (profileData.gender === 'male' || profileData.gender === 'female')
      updateDto.gender = profileData.gender === 'male';

    const apiUrl = `${environment.apis.default.url}/api/profile/personal-info`;
    this.http.put(apiUrl, updateDto, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    }).subscribe({
      next: () => {
        this.showSuccessMessage('Cập nhật thông tin thành công!');
        this.loadProfileData();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.isSaving = false;
        if (error.status === 401 || error.status === 403) {
          this.showErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
          localStorage.clear();
          this.router.navigate(['/candidate/login']);
          return;
        }

        let errorMessage = 'Có lỗi xảy ra khi lưu thông tin';
        if (error.status === 400 && error.error) {
          if (error.error.errors) {
            const messages: string[] = [];
            Object.keys(error.error.errors).forEach(k => {
              const errs = error.error.errors[k];
              if (Array.isArray(errs)) errs.forEach(e => messages.push(`${k}: ${e}`));
              else messages.push(`${k}: ${errs}`);
            });
            if (messages.length > 0) errorMessage = 'Lỗi validation:\n' + messages.join('\n');
          } else if (error.error.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        }
        this.showErrorMessage(errorMessage);
      }
    });
  }

  validateForm(): boolean {
    this.errors = {};
    let valid = true;

    if (!this.profileData.fullName?.trim()) {
      this.errors.fullName = 'Họ và tên là bắt buộc';
      valid = false;
    }
    if (!this.profileData.address?.trim()) {
      this.errors.address = 'Địa chỉ là bắt buộc';
      valid = false;
    }
    if (!this.profileData.dateOfBirth) {
      this.errors.dateOfBirth = 'Ngày sinh là bắt buộc';
      valid = false;
    }
    if (!this.profileData.gender) {
      this.errors.gender = 'Giới tính là bắt buộc';
      valid = false;
    }
    if (!this.profileData.phone?.trim()) {
      this.errors.phone = 'Số điện thoại là bắt buộc';
      valid = false;
    } else {
      const re = /^[0-9]{10,11}$/;
      if (!re.test(this.profileData.phone)) {
        this.errors.phone = 'Số điện thoại phải có 10-11 chữ số';
        valid = false;
      }
    }

    return valid;
  }

  onBackToProfile() {
    this.router.navigate(['/candidate/dashboard']);
  }

  private showSuccessMessage(message: string) {
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  private showErrorMessage(message: string) {
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  openProfilePictureModal() {
    this.showProfilePictureModal = true;
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

  onToggleJobSearch() {
    if (this.jobSearchEnabled) this.jobSearchEnabled = false;
    else this.showEnableJobSearchModal = true;
  }

  onJobSearchToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.showEnableJobSearchModal = true;
      target.checked = false;
      this.jobSearchEnabled = false;
    } else {
      this.jobSearchEnabled = false;
    }
  }

  onAllowRecruiterSearchToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    this.allowRecruiterSearch = target.checked;
  }

  onCloseEnableJobSearchModal() {
    this.showEnableJobSearchModal = false;
  }

  onEnableJobSearch(selectedCvIds: string[]) {
    this.jobSearchEnabled = true;
    this.showSuccessMessage('Đã bật tìm việc thành công!');
  }
}
