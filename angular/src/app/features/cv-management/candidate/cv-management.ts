import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { UploadedCvService, UploadedCv } from '../../../core/services/uploaded-cv.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { ButtonComponent } from '../../../shared/components/button/button';
import { CvListComponent } from '../../../shared/components/cv-list/cv-list';
import { ProfilePictureEditModal } from '../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { UploadCvModal } from '../../../shared/components/upload-cv-modal/upload-cv-modal';
import { DownloadCvModal } from '../../../shared/components/download-cv-modal/download-cv-modal';
import { RenameCvModal } from '../../../shared/components/rename-cv-modal/rename-cv-modal';
import { UploadedCvCard } from '../../../shared/components/uploaded-cv-card/uploaded-cv-card';

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
  cvs: any[] = [];
  loading = false;
  showProfilePictureModal = false;
  showUploadCvModal = false;
  showDownloadModal = false;
  showRenameModal = false;
  cvToRename: any = null;
  uploadedCvs: UploadedCv[] = [];
  
  // Toggle settings
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private uploadedCvService: UploadedCvService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    this.loadCvs();
    
    // Subscribe to uploaded CVs service
    this.uploadedCvService.uploadedCvs$.subscribe(cvs => {
      this.uploadedCvs = cvs;
    });
  }

  loadCvs() {
    // TODO: Hook BE API. For now, use empty list
    this.loading = false;
    this.cvs = [];
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
    // TODO: Call BE set default when connected
    this.showToastMessage(this.translate('cv_management.set_default_successfully'), 'success');
    this.loadCvs();
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
    this.allowRecruiterSearch = target.checked;
    const message = this.allowRecruiterSearch 
      ? 'Đã bật cho phép NTD tìm kiếm hồ sơ' 
      : 'Đã tắt cho phép NTD tìm kiếm hồ sơ';
    this.showToastMessage(message, 'success');
  }
}

