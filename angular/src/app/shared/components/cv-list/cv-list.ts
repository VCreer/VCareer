// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// // import { Cv } from '../../../proxy/cv/cv.service';
// import { ButtonComponent } from '../button/button';
// import { DownloadCvModal } from '../download-cv-modal/download-cv-modal';
// import { ToastNotificationComponent } from '../toast-notification/toast-notification';
// import { ConfirmDeleteModal } from '../confirm-delete-modal/confirm-delete-modal';
// import { RenameCvModal } from '../rename-cv-modal/rename-cv-modal';
// import { TranslationService } from '../../../core/services/translation.service';

// @Component({
//   selector: 'app-cv-list',
//   standalone: true,
//   imports: [CommonModule, ButtonComponent, DownloadCvModal, ToastNotificationComponent, ConfirmDeleteModal, RenameCvModal],
//   templateUrl: './cv-list.html',
//   styleUrls: ['./cv-list.scss']
// })
// export class CvListComponent {
//   // @Input() cvs: Cv[] = [];
//   @Input() loading = false;
//   @Output() cvUpdated = new EventEmitter<string>();
//   @Output() cvDeleted = new EventEmitter<string>();
//   @Output() cvDuplicated = new EventEmitter<string>();
//   @Output() cvSetDefault = new EventEmitter<string>();
//   @Output() cvViewed = new EventEmitter<string>();
//   @Output() cvEdited = new EventEmitter<string>();
//   @Output() createCv = new EventEmitter<void>();

//   hoveredCvId: string | null = null;
//   showMoreMenu: string | null = null;
//   showDownloadModal = false;
//   showConfirmDeleteModal = false;
//   showRenameModal = false;
//   cvToDelete: string | null = null;
//   cvToRename: string | null = null;
//   currentCvName: string = '';
  
//   // Toast notification properties
//   showToast = false;
//   toastMessage = '';
//   toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

//   constructor(private translationService: TranslationService) {}

//   translate(key: string): string {
//     return this.translationService.translate(key);
//   }

//   onCvHover(cvId: string) {
//     this.hoveredCvId = cvId;
//   }

//   onCvLeave(cvId: string) {
//     this.hoveredCvId = null;
//     this.showMoreMenu = null;
//   }

//   toggleMoreMenu(cvId: string) {
//     this.showMoreMenu = this.showMoreMenu === cvId ? null : cvId;
//   }

//   onViewCv(cvId: string) {
//     this.cvViewed.emit(cvId);
//   }

//   onEditCv(cvId: string) {
//     this.cvEdited.emit(cvId);
//   }

//   onDuplicateCv(cvId: string) {
//     this.cvDuplicated.emit(cvId);
//   }

//   onSetDefaultCv(cvId: string) {
//     this.cvSetDefault.emit(cvId);
//   }

//   onDeleteCv(cvId: string) {
//     this.cvToDelete = cvId;
//     this.showConfirmDeleteModal = true;
//   }

//   // onRenameCv(cvId: string) {
//   //   this.cvToRename = cvId;
//   //   const cv = this.cvs.find(c => c.id === cvId);
//   //   this.currentCvName = cv ? cv.title : '';
//   //   this.showRenameModal = true;
//   // }

//   onCreateCv() {
//     this.createCv.emit();
//   }


//   onPushToTop(cvId: string) {
//     // Emit push to top event
//     console.log('Push to top CV:', cvId);
//   }

//   onCopyLink(cvId: string) {
//     // Copy CV link to clipboard
//     const link = `${window.location.origin}/cv/${cvId}`;
//     navigator.clipboard.writeText(link);
//     console.log('Link copied:', link);
//   }

//   onShareFacebook(cvId: string) {
//     // Share on Facebook
//     const link = `${window.location.origin}/cv/${cvId}`;
//     const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
//     window.open(facebookUrl, '_blank');
//   }


//   onToggleStar(cvId: string) {
//     console.log('Toggle star for CV:', cvId);
//     this.cvSetDefault.emit(cvId);
//   }

//   onDownloadCv(cvId: string) {
//     this.showDownloadModal = true;
//     console.log('Download CV:', cvId);
//   }

//   onCloseDownloadModal() {
//     this.showDownloadModal = false;
//   }

//   onDownloadWithoutLogo() {
//     console.log('Download CV without logo');
//     this.showDownloadModal = false;
//   }

//   onDownloadFree() {
//     console.log('Download CV free');
//     this.showDownloadModal = false;
//   }


//   onCloseConfirmDeleteModal() {
//     this.showConfirmDeleteModal = false;
//     this.cvToDelete = null;
//   }

//   onConfirmDelete() {
//     if (this.cvToDelete) {
//       this.cvDeleted.emit(this.cvToDelete);
//       this.showSuccessToast('cv_management.delete_success');
//       this.showConfirmDeleteModal = false;
//       this.cvToDelete = null;
//     }
//   }

//   onCloseRenameModal() {
//     this.showRenameModal = false;
//     this.cvToRename = null;
//     this.currentCvName = '';
//   }

//   // onRename(newName: string) {
//   //   if (this.cvToRename && newName.trim()) {
//   //     // Update the CV name in the local array immediately
//   //     const cv = this.cvs.find(c => c.id === this.cvToRename);
//   //     if (cv) {
//   //       cv.title = newName.trim();
//   //     }
      
//   //     this.cvUpdated.emit(this.cvToRename);
//   //     this.showSuccessToast('cv_management.rename_success');
//   //     this.showRenameModal = false;
//   //     this.cvToRename = null;
//   //     this.currentCvName = '';
//   //   }
//   // }

//   private showSuccessToast(message: string) {
//     this.toastMessage = this.translate(message);
//     this.toastType = 'success';
//     this.showToast = true;
    
//     setTimeout(() => {
//       this.showToast = false;
//     }, 3000);
//   }

//   onToastClose() {
//     this.showToast = false;
//   }
// }
