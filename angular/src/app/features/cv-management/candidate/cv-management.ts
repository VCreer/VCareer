import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { CvListComponent } from '../../../shared/components/cv-list/cv-list';
import { ButtonComponent } from '../../../shared/components/button/button';
import { ProfilePictureEditModal } from '../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { UploadCvModal } from '../../../shared/components/upload-cv-modal/upload-cv-modal';
import { DownloadCvModal } from '../../../shared/components/download-cv-modal/download-cv-modal';
import { RenameCvModal } from '../../../shared/components/rename-cv-modal/rename-cv-modal';
import { UploadedCvCard } from '../../../shared/components/uploaded-cv-card/uploaded-cv-card';
import { CvService, Cv } from '../../../proxy/api/cv.service';

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
  cvs: Cv[] = [];
  loading = false;
  showProfilePictureModal = false;
  showUploadCvModal = false;
  showDownloadModal = false;
  showRenameModal = false;
  cvToRename: any = null;
  uploadedCvs: any[] = [];

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private cvService: CvService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    this.loadCvs();
  }

  loadCvs() {
    this.loading = true;
    this.cvService.getCvs().subscribe({
      next: (cvs) => {
        this.cvs = cvs;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        this.loading = false;
      }
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onCreateCv() {
    console.log('onCreateCv called');
    this.showUploadCvModal = true;
  }

  onCloseUploadCvModal() {
    this.showUploadCvModal = false;
  }

  onUploadCv(file: File) {
    // Simulate upload success and add to uploaded CVs
    const uploadedCv = {
      name: file.name,
      uploadDate: new Date().toLocaleString('vi-VN'),
      isStarred: false
    };
    this.uploadedCvs.push(uploadedCv);
    this.showToastMessage(this.translate('upload_cv.upload_success'), 'success');
    this.showUploadCvModal = false;
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
    this.cvService.deleteCv(cvId).subscribe({
      next: (success) => {
        if (success) {
          this.showToastMessage(this.translate('cv_management.deleted_successfully'), 'success');
          this.loadCvs();
        } else {
          this.showToastMessage(this.translate('cv_management.delete_failed'), 'error');
        }
      },
      error: () => {
        this.showToastMessage(this.translate('cv_management.delete_failed'), 'error');
      }
    });
  }

  onCvDuplicated(cvId: string) {
    this.cvService.duplicateCv(cvId).subscribe({
      next: (cv) => {
        if (cv) {
          this.showToastMessage(this.translate('cv_management.duplicated_successfully'), 'success');
          this.loadCvs();
        } else {
          this.showToastMessage(this.translate('cv_management.duplicate_failed'), 'error');
        }
      },
      error: () => {
        this.showToastMessage(this.translate('cv_management.duplicate_failed'), 'error');
      }
    });
  }

  onSetDefault(cvId: string) {
    this.cvService.setDefaultCv(cvId).subscribe({
      next: (success) => {
        if (success) {
          this.showToastMessage(this.translate('cv_management.set_default_successfully'), 'success');
          this.loadCvs();
        } else {
          this.showToastMessage(this.translate('cv_management.set_default_failed'), 'error');
        }
      },
      error: () => {
        this.showToastMessage(this.translate('cv_management.set_default_failed'), 'error');
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
    // Remove from uploadedCvs array
    this.uploadedCvs = this.uploadedCvs.filter(uploadedCv => uploadedCv.name !== cv.name);
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

