import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { UploadedCvService, UploadedCv } from '../../../../core/services/uploaded-cv.service';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { CvListComponent } from '../../../../shared/components/cv-list/cv-list';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ProfilePictureEditModal } from '../../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { UploadCvModal } from '../../../../shared/components/upload-cv-modal/upload-cv-modal';
import { DownloadCvModal } from '../../../../shared/components/download-cv-modal/download-cv-modal';
import { RenameCvModal } from '../../../../shared/components/rename-cv-modal/rename-cv-modal';
import { UploadedCvCard } from '../../../../shared/components/uploaded-cv-card/uploaded-cv-card';
import { CandidateCvService } from '../../../../proxy/http-api/controllers/candidate-cv.service';
import { CandidateCvDto, GetCandidateCvListDto } from '../../../../proxy/cv/models';

// Interface để map dữ liệu cho UI - ĐẶT TRƯỚC Component decorator
export interface CvDisplayItem {
  id: string;
  title: string;
  preview: string;
  isDefault: boolean;
  updatedAt: string;
  version?: string;
  cvData?: CandidateCvDto;
}

@Component({
  selector: 'app-cv-management',
  standalone: true,
  imports: [
    CommonModule,
    ToastNotificationComponent,
    CvListComponent,
    ButtonComponent,
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
  cvs: CvDisplayItem[] = [];
  loading = false;
  showProfilePictureModal = false;
  showUploadCvModal = false;
  showDownloadModal = false;
  showRenameModal = false;
  cvToRename: any = null;
  uploadedCvs: UploadedCv[] = [];

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private candidateCvService: CandidateCvService,
    private uploadedCvService: UploadedCvService
  ) {}

  ngOnInit() {
    console.log('CvManagementComponent ngOnInit called');
    console.log('CandidateCvService:', this.candidateCvService);
    
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    
    // Subscribe to uploaded CVs service
    this.uploadedCvService.uploadedCvs$.subscribe(cvs => {
      this.uploadedCvs = cvs;
    });
    
    // Load CVs
    console.log('Calling loadCvs()...');
    this.loadCvs();
  }

  loadCvs() {
    console.log('loadCvs() called');
    this.loading = true;
    
    // Tạo input để lấy danh sách CV của user hiện tại
    const input: GetCandidateCvListDto = {
      skipCount: 0,
      maxResultCount: 100,
      sorting: 'creationTime DESC'
    };

    console.log('Calling candidateCvService.getList with input:', input);
    console.log('Service instance:', this.candidateCvService);
    
    const subscription = this.candidateCvService.getList(input).subscribe({
      next: (response: any) => {
        console.log('CV List Response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // Extract data từ ActionResult hoặc PagedResultDto
        // Response có thể là:
        // 1. ActionResult<PagedResultDto<CandidateCvDto>> với result.items
        // 2. ActionResult với result là array
        // 3. PagedResultDto với items
        // 4. Array trực tiếp
        let cvList: CandidateCvDto[] = [];
        
        // Case 1: ActionResult với result là PagedResultDto
        if (response.result?.items && Array.isArray(response.result.items)) {
          cvList = response.result.items;
        }
        // Case 2: ActionResult với result là array
        else if (response.result && Array.isArray(response.result)) {
          cvList = response.result;
        }
        // Case 3: PagedResultDto trực tiếp
        else if (response.items && Array.isArray(response.items)) {
          cvList = response.items;
        }
        // Case 4: Array trực tiếp
        else if (Array.isArray(response)) {
          cvList = response;
        }
        // Case 5: ActionResult với value
        else if (response.value?.items && Array.isArray(response.value.items)) {
          cvList = response.value.items;
        }
        else if (response.value && Array.isArray(response.value)) {
          cvList = response.value;
        }
        // Case 6: Data property
        else if (response.data?.items && Array.isArray(response.data.items)) {
          cvList = response.data.items;
        }
        else if (response.data && Array.isArray(response.data)) {
          cvList = response.data;
        }
        
        console.log('Extracted CV List:', cvList);
        
        // Map CandidateCvDto sang CvDisplayItem
        this.cvs = cvList.map(cv => this.mapCvToDisplayItem(cv));
        this.loading = false;
        
        if (this.cvs.length === 0) {
          console.log('No CVs found. User may need to create a CV first.');
        }
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        this.showToastMessage(this.translate('cv_management.load_error') || 'Lỗi khi tải danh sách CV', 'error');
        this.loading = false;
      }
    });
    
    // Log subscription để debug
    console.log('Subscription created:', subscription);
  }

  /**
   * Map CandidateCvDto sang CvDisplayItem để hiển thị
   */
  private mapCvToDisplayItem(cv: CandidateCvDto): CvDisplayItem {
    // Lấy preview image từ template
    // Nếu không có previewImageUrl, tạo placeholder hoặc dùng default
    let previewImage = cv.template?.previewImageUrl;
    
    if (!previewImage || previewImage.trim() === '') {
      // Nếu không có preview image, tạo data URL từ CV render để làm thumbnail
      // Hoặc dùng placeholder mặc định
      previewImage = this.generatePreviewPlaceholder(cv);
    }

    // Format updated date - ưu tiên publishedAt, sau đó dùng creationTime
    let updatedAt = '';
    if (cv.publishedAt) {
      updatedAt = new Date(cv.publishedAt).toLocaleDateString('vi-VN');
    } else {
      // Fallback to current date formatted
      updatedAt = new Date().toLocaleDateString('vi-VN');
    }

    return {
      id: cv.id || '',
      title: cv.cvName || 'CV chưa có tên',
      preview: previewImage,
      isDefault: cv.isDefault || false,
      updatedAt: updatedAt,
      version: cv.template?.version || '1.0',
      cvData: cv
    };
  }

  /**
   * Generate preview placeholder khi không có preview image
   */
  private generatePreviewPlaceholder(cv: CandidateCvDto): string {
    // Tạo placeholder dựa trên template name hoặc CV name
    const templateName = cv.template?.name || 'CV';
    const cvName = cv.cvName || 'CV';
    
    // Có thể tạo một SVG placeholder hoặc dùng image mặc định
    // Hoặc có thể render CV thành thumbnail (nhưng tốn performance)
    
    // Tạm thời dùng placeholder image
    return 'assets/images/cv-management/cv-preview-placeholder.png';
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onCreateCv() {
    // Navigate to CV template selection page
    this.router.navigate(['/candidate/cv-sample']);
  }

  onCloseUploadCvModal() {
    this.showUploadCvModal = false;
  }

  onUploadCv(file: File) {
    // Simulate upload success and add to uploaded CVs
    const uploadedCv: UploadedCv = {
      name: file.name,
      uploadDate: new Date().toLocaleString('vi-VN'),
      isStarred: false
    };
    this.uploadedCvService.addUploadedCv(uploadedCv);
    this.showToastMessage(this.translate('upload_cv.upload_success'), 'success');
    this.showUploadCvModal = false;
  }

  viewCv(cvId: string) {
    // Navigate đến trang view CV (không dùng popup)
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
    this.candidateCvService.delete(cvId).subscribe({
      next: () => {
        this.showToastMessage(this.translate('cv_management.deleted_successfully') || 'Xóa CV thành công', 'success');
        this.loadCvs();
      },
      error: (error) => {
        console.error('Error deleting CV:', error);
        this.showToastMessage(this.translate('cv_management.delete_failed') || 'Xóa CV thất bại', 'error');
      }
    });
  }

  onCvDuplicated(cvId: string) {
    // Lấy CV hiện tại
    this.candidateCvService.get(cvId).subscribe({
      next: (response: any) => {
        // Extract CV từ ActionResult
        let cv: CandidateCvDto;
        if (response.result) {
          cv = response.result;
        } else if (response.data) {
          cv = response.data;
        } else {
          cv = response;
        }
        
        if (!cv || !cv.id || !cv.templateId) {
          this.showToastMessage(this.translate('cv_management.duplicate_failed') || 'Không thể sao chép CV', 'error');
          return;
        }

        // Tạo CV mới với dữ liệu tương tự
        const duplicateDto = {
          templateId: cv.templateId,
          cvName: `${cv.cvName} (Bản sao)`,
          dataJson: cv.dataJson || '{}',
          isPublished: false,
          isDefault: false,
          isPublic: false,
          notes: cv.notes || ''
        };

        this.candidateCvService.create(duplicateDto).subscribe({
          next: () => {
            this.showToastMessage(this.translate('cv_management.duplicated_successfully') || 'Sao chép CV thành công', 'success');
            this.loadCvs();
          },
          error: (error) => {
            console.error('Error duplicating CV:', error);
            this.showToastMessage(this.translate('cv_management.duplicate_failed') || 'Sao chép CV thất bại', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error getting CV to duplicate:', error);
        this.showToastMessage(this.translate('cv_management.duplicate_failed') || 'Sao chép CV thất bại', 'error');
      }
    });
  }

  onSetDefault(cvId: string) {
    this.candidateCvService.setDefault(cvId).subscribe({
      next: () => {
        this.showToastMessage(this.translate('cv_management.set_default_successfully') || 'Đặt CV mặc định thành công', 'success');
        this.loadCvs();
      },
      error: (error) => {
        console.error('Error setting default CV:', error);
        this.showToastMessage(this.translate('cv_management.set_default_failed') || 'Đặt CV mặc định thất bại', 'error');
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
  onCvDownload() {
    this.showDownloadModal = true;
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
    this.showToastMessage(this.translate('cv_card.delete_success'), 'success');
    // Remove from uploadedCvs service
    this.uploadedCvService.removeUploadedCv(cv.name);
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
}

