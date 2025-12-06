import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../core/services/translation.service';
import { UploadedCvService as LocalUploadedCvService, UploadedCv } from '../../../core/services/uploaded-cv.service';
import { UploadedCvService } from '../../../proxy/http-api/controllers/uploaded-cv.service';
import type { UploadCvRequestDto, UploadedCvDto, GetUploadedCvListDto } from '../../../proxy/application/contracts/cv/models';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { ButtonComponent } from '../../../shared/components/button/button';
import { CvListComponent } from '../../../shared/components/cv-list/cv-list';
import { ProfilePictureEditModal } from '../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { UploadCvModal } from '../../../shared/components/upload-cv-modal/upload-cv-modal';
import { DownloadCvModal } from '../../../shared/components/download-cv-modal/download-cv-modal';
import { RenameCvModal } from '../../../shared/components/rename-cv-modal/rename-cv-modal';
import { UploadedCvCard } from '../../../shared/components/uploaded-cv-card/uploaded-cv-card';
import { CandidateCvService } from '../../../proxy/http-api/controllers/candidate-cv.service';
import type { CandidateCvDto, GetCandidateCvListDto } from '../../../proxy/cv/models';
import { AuthStateService } from '../../../core/services/auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from '../../../core/services/auth-Cookiebased/auth-facade.service';
import { ProfileService } from '../../../proxy/services/profile/profile.service';
import type { ProfileDto } from '../../../proxy/dto/profile/models';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-cv-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastNotificationComponent,
    ButtonComponent,
    CvListComponent,
    ProfilePictureEditModal,
    UploadCvModal,
    DownloadCvModal,
    RenameCvModal,
    UploadedCvCard
  ],
  templateUrl: './cv-management.html',
  styleUrls: ['./cv-management.scss']
})
export class CvManagementComponent implements OnInit {
  selectedLanguage = 'vi';
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  cvs: CandidateCvDto[] = [];
  loading = false;
  showProfilePictureModal = false;
  showUploadCvModal = false;
  showDownloadModal = false;
  showRenameModal = false;
  cvToRename: any = null;
  uploadedCvs: UploadedCv[] = [];
  defaultCv: CandidateCvDto | null = null; // CV được đánh dấu mặc định
  
  // Toggle settings
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;
  
  // User info
  currentUser: any = null;
  userName: string = '';
  profileData = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    location: ''
  };
  isLoadingProfile: boolean = false;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private localUploadedCvService: LocalUploadedCvService,
    private uploadedCvService: UploadedCvService,
    private candidateCvService: CandidateCvService,
    private authStateService: AuthStateService,
    private authFacadeService: AuthFacadeService,
    private http: HttpClient,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    
    // Kiểm tra authentication trước khi load CVs
    if (!this.authStateService.user) {
      this.authFacadeService.loadCurrentUser().subscribe({
        next: () => {
          this.loadCvs();
        },
        error: (err) => {
          console.error('Error loading user:', err);
          // Vẫn load CVs nếu không load được user (có thể cookies vẫn hợp lệ)
          this.loadCvs();
        }
      });
    } else {
      this.loadCvs();
    }
    
    // Load uploaded CVs từ API
    this.loadUploadedCvs();
    // Load CV mặc định - không hiển thị error nếu không có
    this.loadDefaultCvSilently();
    
    // Subscribe to uploaded CVs service (local state)
    this.localUploadedCvService.uploadedCvs$.subscribe(cvs => {
      // Chỉ update nếu chưa load từ API
      if (this.uploadedCvs.length === 0) {
        this.uploadedCvs = cvs;
      }
    });
    
    // Load user info để hiển thị tên
    this.loadProfileData();
  }

  loadCvs() {
    this.loading = true;
    
    const input: GetCandidateCvListDto = {
      skipCount: 0,
      maxResultCount: 1000, // Load tất cả CVs
      sorting: 'creationTime DESC'
    };
    
    this.candidateCvService.getList(input).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        // Xử lý response - có thể là ActionResult hoặc PagedResultDto
        let cvList: CandidateCvDto[] = [];
        
        if (response) {
          // Case 1: ActionResult với result là PagedResultDto
          if (response.result && response.result.items) {
            cvList = response.result.items;
          }
          // Case 2: ActionResult với result là array
          else if (response.result && Array.isArray(response.result)) {
            cvList = response.result;
          }
          // Case 3: ActionResult với value là PagedResultDto
          else if (response.value && response.value.items) {
            cvList = response.value.items;
          }
          // Case 4: ActionResult với value là array
          else if (response.value && Array.isArray(response.value)) {
            cvList = response.value;
          }
          // Case 5: Response trực tiếp là PagedResultDto
          else if (response.items && Array.isArray(response.items)) {
            cvList = response.items;
          }
          // Case 6: Response trực tiếp là array
          else if (Array.isArray(response)) {
            cvList = response;
          }
        }
        
        // Map CandidateCvDto sang format mà cv-list component mong đợi
        this.cvs = cvList.map(cv => {
          // Lấy ngày cập nhật - ưu tiên publishedAt, nếu không có thì dùng ngày hiện tại
          const updateDate = cv.publishedAt || new Date().toISOString();
          
          return {
            id: cv.id || '',
            title: cv.cvName || 'Untitled CV',
            preview: cv.previewImageUrl || cv.template?.previewImageUrl || 'assets/images/cv-management/no-cv.png',
            version: cv.template?.version || '1.0',
            updatedAt: this.formatDate(updateDate),
            isDefault: cv.isDefault || false,
            // Giữ lại toàn bộ dữ liệu gốc để sử dụng sau
            ...cv
          };
        });
        console.log('Loaded CVs:', this.cvs);
        // Reload CV mặc định sau khi load danh sách
        this.loadDefaultCv();
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        this.loading = false;
        this.cvs = [];
        this.showToastMessage('Không thể tải danh sách CV. Vui lòng thử lại sau.', 'error');
      }
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onCreateCv() {
    this.router.navigate(['/candidate/cv-sample']);
  }

  onOpenUploadCvModal() {
    this.showUploadCvModal = true;
  }

  onCloseUploadCvModal() {
    this.showUploadCvModal = false;
  }

  onUploadCv(file: File) {
    // Tạo FormData để upload file với multipart/form-data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cvName', file.name.replace(/\.[^/.]+$/, '')); // Tên file không có extension
    formData.append('isDefault', 'false');
    formData.append('isPublic', 'true');
    
    // Gọi API upload CV sử dụng HttpClient trực tiếp với FormData
    const apiUrl = `${environment.apis.default.url}/api/cv/uploaded/upload`;
    
    this.http.post<any>(apiUrl, formData, {
      withCredentials: true,
      headers: {
        // Không set Content-Type, browser sẽ tự động set với boundary cho multipart/form-data
      }
    }).subscribe({
      next: (response: any) => {
        // Xử lý response
        let uploadedCv: UploadedCvDto | null = null;
        
        if (response && response.result) {
          uploadedCv = response.result;
        } else if (response && response.value) {
          uploadedCv = response.value;
        } else if (response && !response.result && !response.value) {
          uploadedCv = response;
        }
        
        if (uploadedCv) {
          this.showToastMessage('Upload CV thành công!', 'success');
          // Reload danh sách uploaded CVs
          this.loadUploadedCvs();
        } else {
          this.showToastMessage('Upload CV thành công nhưng không nhận được dữ liệu phản hồi.', 'warning');
          this.loadUploadedCvs();
        }
        
        this.showUploadCvModal = false;
      },
      error: (error) => {
        console.error('Error uploading CV:', error);
        let errorMessage = 'Không thể upload CV. Vui lòng thử lại.';
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.showToastMessage(errorMessage, 'error');
      }
    });
  }

  loadUploadedCvs() {
    const input: GetUploadedCvListDto = {
      skipCount: 0,
      maxResultCount: 1000,
      sorting: 'uploadTime DESC'
    };
    
    this.uploadedCvService.getList(input).subscribe({
      next: (response: any) => {
        let uploadedCvList: UploadedCvDto[] = [];
        
        // Xử lý response tương tự như loadCvs
        if (response) {
          if (response.result && response.result.items) {
            uploadedCvList = response.result.items;
          } else if (response.result && Array.isArray(response.result)) {
            uploadedCvList = response.result;
          } else if (response.value && response.value.items) {
            uploadedCvList = response.value.items;
          } else if (response.value && Array.isArray(response.value)) {
            uploadedCvList = response.value;
          } else if (response.items && Array.isArray(response.items)) {
            uploadedCvList = response.items;
          } else if (Array.isArray(response)) {
            uploadedCvList = response;
          }
        }
        
        // Map UploadedCvDto sang UploadedCv format cho component
        // Lưu cả ID để có thể delete sau này
        this.uploadedCvs = uploadedCvList.map(cv => ({
          name: cv.cvName || cv.originalFileName || 'Untitled CV',
          uploadDate: this.formatDate(cv.uploadTime),
          isStarred: cv.isDefault || false,
          id: cv.id // Lưu ID để có thể delete
        } as UploadedCv & { id?: string }));
        
        console.log('Loaded uploaded CVs:', this.uploadedCvs);
      },
      error: (error) => {
        console.error('Error loading uploaded CVs:', error);
        // Không hiển thị error message vì đây là optional feature
      }
    });
  }

  viewCv(cvId: string) {
    this.router.navigate(['/candidate/cv-management/view', cvId]);
  }

  editCv(cvId: string) {
    this.router.navigate(['/candidate/cv-management/edit', cvId]);
  }

  onCvUpdated(cvId: string) {
    this.showToastMessage(this.translate('cv_management.updated_successfully'), 'success');
    this.loadCvs();
  }

  onCvDeleted(cvId: string) {
    // TODO: Call BE delete when connected
    this.showToastMessage(this.translate('cv_management.deleted_successfully'), 'success');
    this.loadCvs();
  }

  onCvDuplicated(cvId: string) {
    // TODO: Call BE duplicate when connected
    this.showToastMessage(this.translate('cv_management.duplicated_successfully'), 'success');
    this.loadCvs();
  }

  onSetDefault(cvId: string) {
    this.loading = true;
    this.candidateCvService.setDefault(cvId).subscribe({
      next: () => {
        this.showToastMessage(this.translate('cv_management.set_default_successfully'), 'success');
        // Reload danh sách CVs và CV mặc định
        this.loadCvs();
        this.loadDefaultCv();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error setting default CV:', error);
        let errorMessage = 'Không thể đặt CV mặc định. Vui lòng thử lại.';
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.showToastMessage(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  loadDefaultCv() {
    this.candidateCvService.getDefaultCv().subscribe({
      next: (response: any) => {
        let defaultCv: CandidateCvDto | null = null;
        
        // Parse response tương tự như loadCvs
        if (response && response.result) {
          if (Array.isArray(response.result)) {
            defaultCv = response.result.length > 0 ? response.result[0] : null;
          } else {
            defaultCv = response.result;
          }
        } else if (response && response.value) {
          if (Array.isArray(response.value)) {
            defaultCv = response.value.length > 0 ? response.value[0] : null;
          } else {
            defaultCv = response.value;
          }
        } else if (response && !response.result && !response.value) {
          defaultCv = response;
        }
        
        this.defaultCv = defaultCv;
      },
      error: (error) => {
        // Nếu không có CV mặc định, set null
        if (error.status === 404) {
          this.defaultCv = null;
        } else {
          console.error('Error loading default CV:', error);
        }
      }
    });
  }

  // Load CV mặc định mà không hiển thị error modal
  // Sử dụng HttpClient trực tiếp để bypass ABP error handler
  loadDefaultCvSilently() {
    const apiUrl = `${environment.apis.default.url}/api/cv/candidates/default`;
    
    this.http.get<any>(apiUrl, {
      withCredentials: true
    }).pipe(
      catchError((error) => {
        // Ẩn error hoàn toàn - không hiển thị dialog
        this.defaultCv = null;
        // Không log error để không làm phiền user
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (!response) {
          this.defaultCv = null;
          return;
        }
        
        let defaultCv: CandidateCvDto | null = null;
        
        // Parse response tương tự như loadCvs
        if (response && response.result) {
          if (Array.isArray(response.result)) {
            defaultCv = response.result.length > 0 ? response.result[0] : null;
          } else {
            defaultCv = response.result;
          }
        } else if (response && response.value) {
          if (Array.isArray(response.value)) {
            defaultCv = response.value.length > 0 ? response.value[0] : null;
          } else {
            defaultCv = response.value;
          }
        } else if (response && !response.result && !response.value) {
          defaultCv = response;
        }
        
        this.defaultCv = defaultCv;
      }
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose() {
    this.showToast = false;
  }

  // Profile Picture Modal methods
  openProfilePictureModal() {
    this.showProfilePictureModal = true;
  }

  closeProfilePictureModal() {
    this.showProfilePictureModal = false;
  }

  onProfilePictureChange() {
    this.showToastMessage(this.translate('profile_picture_edit.change_success'), 'success');
    this.closeProfilePictureModal();
  }

  onProfilePictureDelete() {
    this.showToastMessage(this.translate('profile_picture_edit.delete_success'), 'success');
    this.closeProfilePictureModal();
  }

  // CV Card methods for uploaded CVs
  onCvView(cv: any) {
    // Tìm CV trong uploadedCvs để lấy ID
    const uploadedCv = this.uploadedCvs.find(ucv => ucv.name === cv.name);
    if (uploadedCv && (uploadedCv as any).id) {
      const cvId = (uploadedCv as any).id;
      
      // Fetch file as blob để hiển thị trong browser thay vì download
      const viewUrl = `${environment.apis.default.url}/api/cv/uploaded/${cvId}/download?inline=true`;
      
      this.http.get(viewUrl, { 
        responseType: 'blob',
        withCredentials: true 
      }).subscribe({
        next: (blob: Blob) => {
          // Tạo blob URL từ file PDF
          const blobUrl = URL.createObjectURL(blob);
          
          // Mở trong tab mới để xem
          const newWindow = window.open(blobUrl, '_blank');
          
          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            this.showToastMessage('Vui lòng cho phép popup để xem CV.', 'warning');
            URL.revokeObjectURL(blobUrl);
          }
        },
        error: (error) => {
          console.error('Error viewing CV:', error);
          this.showToastMessage('Không thể xem CV. Vui lòng thử lại.', 'error');
        }
      });
    } else {
      this.showToastMessage('Không thể xem CV. Vui lòng thử lại.', 'error');
    }
  }

  onCvDownload(cv: any) {
    // Tìm CV trong uploadedCvs để lấy ID
    const uploadedCv = this.uploadedCvs.find(ucv => ucv.name === cv.name);
    if (uploadedCv && (uploadedCv as any).id) {
      const cvId = (uploadedCv as any).id;
      // Download file với inline=false
      const downloadUrl = `${environment.apis.default.url}/api/cv/uploaded/${cvId}/download?inline=false`;
      window.open(downloadUrl, '_blank');
    } else {
      this.showToastMessage('Không thể tải CV. Vui lòng thử lại.', 'error');
    }
  }

  onCvToggleStar(cv: any) {
    cv.isStarred = !cv.isStarred;
  }

  onCvCopyLink() {
    this.showToastMessage(this.translate('cv_card.copy_link_success'), 'success');
  }

  onCvRename(cv: any) {
    this.cvToRename = cv;
    this.showRenameModal = true;
  }

  onCvDelete(cv: any) {
    // Gọi API delete uploaded CV
    // Tìm CV trong uploadedCvs để lấy ID
    const uploadedCv = this.uploadedCvs.find(ucv => ucv.name === cv.name);
    if (uploadedCv && (uploadedCv as any).id) {
      this.uploadedCvService.delete((uploadedCv as any).id).subscribe({
        next: () => {
          this.showToastMessage('Xóa CV thành công!', 'success');
          // Reload danh sách
          this.loadUploadedCvs();
        },
        error: (error) => {
          console.error('Error deleting uploaded CV:', error);
          this.showToastMessage('Không thể xóa CV. Vui lòng thử lại.', 'error');
        }
      });
    } else {
      // Nếu không có ID, chỉ remove khỏi local state
      this.localUploadedCvService.removeUploadedCv(cv.name);
      this.showToastMessage(this.translate('cv_card.delete_success'), 'success');
    }
  }

  onCvShareFacebook() {
    this.showToastMessage(this.translate('cv_card.share_facebook_success'), 'success');
  }

  // Download modal methods
  onCloseDownloadModal() {
    this.showDownloadModal = false;
  }

  onDownloadWithoutLogo() {
    this.showToastMessage(this.translate('download_cv.success_without_logo'), 'success');
    this.showDownloadModal = false;
  }

  onDownloadFree() {
    this.showToastMessage(this.translate('download_cv.success_free'), 'success');
    this.showDownloadModal = false;
  }

  // Rename modal methods
  onCloseRenameModal() {
    this.showRenameModal = false;
    this.cvToRename = null;
  }

  onRename(newName: string) {
    if (this.cvToRename && newName.trim()) {
      this.cvToRename.name = newName.trim();
      this.showToastMessage(this.translate('cv_card.rename_success'), 'success');
      this.showRenameModal = false;
      this.cvToRename = null;
    }
  }

  trackByCvName(index: number, cv: any): string {
    return cv.name;
  }

  // Toggle handlers
  onJobSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.jobSearchEnabled = target.checked;
    const message = this.jobSearchEnabled 
      ? 'Đã bật tìm việc thành công' 
      : 'Đã tắt tìm việc thành công';
    this.showToastMessage(message, 'success');
  }

  onAllowRecruiterSearchToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    
    // Gọi API để update ProfileVisibility
    this.profileService.updateProfileVisibility(newValue).subscribe({
      next: () => {
        this.allowRecruiterSearch = newValue;
        const message = this.allowRecruiterSearch 
          ? 'Đã bật cho phép NTD tìm kiếm hồ sơ' 
          : 'Đã tắt cho phép NTD tìm kiếm hồ sơ';
        this.showToastMessage(message, 'success');
      },
      error: (error) => {
        console.error('Error updating profile visibility:', error);
        // Revert toggle nếu có lỗi
        target.checked = !newValue;
        this.showToastMessage('Không thể cập nhật cài đặt. Vui lòng thử lại.', 'error');
      }
    });
  }

  private formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '';
    }
  }

  loadProfileData(): void {
    this.isLoadingProfile = true;
    
    // Với cookies, kiểm tra user từ AuthStateService
    if (!this.authStateService.user) {
      this.authFacadeService.loadCurrentUser().subscribe({
        next: (user) => {
          // Đã có user, tiếp tục load profile
          this.loadProfileDataInternal();
        },
        error: (err) => {
          // Không có cookies hợp lệ, không load profile
          this.isLoadingProfile = false;
        }
      });
      return;
    }

    // Đã có user, load profile
    this.loadProfileDataInternal();
  }

  private loadProfileDataInternal(): void {
    this.isLoadingProfile = true;
    
    const apiUrl = `${environment.apis.default.url}/api/profile`;
    this.http.get<ProfileDto>(apiUrl, {
      withCredentials: true,
      headers: {
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
          this.userName = '';
          this.isLoadingProfile = false;
          return;
        }

        const fullName = `${response.name || ''} ${response.surname || ''}`.trim() || 'User';
        this.profileData = {
          fullName: fullName,
          email: response.email || '',
          phone: response.phoneNumber || '',
          dateOfBirth: response.dateOfBirth ? response.dateOfBirth.split('T')[0] : '',
          gender: response.gender === true ? 'male' : (response.gender === false ? 'female' : ''),
          address: response.location || response.address || '',
          location: response.location || ''
        };
        
        // Cập nhật userName để tương thích với code cũ
        this.userName = fullName;
        
        // Load ProfileVisibility từ profile
        if (response.profileVisibility !== undefined && response.profileVisibility !== null) {
          this.allowRecruiterSearch = response.profileVisibility;
        }

        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.profileData = {
          fullName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          location: ''
        };
        this.userName = '';
        this.isLoadingProfile = false;
      }
    });
  }
}

