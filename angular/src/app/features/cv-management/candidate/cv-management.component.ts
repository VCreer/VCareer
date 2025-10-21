import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';
import { CvListComponent } from '../../../shared/components/cv-list/cv-list.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ProfilePictureEditModal } from '../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { CvService, Cv } from '../../../proxy/api/cv.service';

@Component({
  selector: 'app-cv-management',
  standalone: true,
  imports: [
    CommonModule,
    ToastNotificationComponent,
    CvListComponent,
    ButtonComponent,
    ProfilePictureEditModal
  ],
  templateUrl: './cv-management.component.html',
  styleUrls: ['./cv-management.component.scss']
})
export class CvManagementComponent implements OnInit {
  selectedLanguage = 'vi';
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  cvs: Cv[] = [];
  loading = false;
  showProfilePictureModal = false;

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
    this.showToastMessage(this.translate('cv_management.creating_cv'), 'info');
    this.router.navigate(['/candidate/cv-management/create']);
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

  // Profile Picture Modal methods
  openProfilePictureModal() {
    this.showProfilePictureModal = true;
  }

  closeProfilePictureModal() {
    this.showProfilePictureModal = false;
  }

  onProfilePictureChange() {
    console.log('Handle profile picture change logic');
    this.showToastMessage(this.translate('profile_picture_edit.change_success'), 'success');
    this.closeProfilePictureModal();
  }

  onProfilePictureDelete() {
    console.log('Handle profile picture delete logic');
    this.showToastMessage(this.translate('profile_picture_edit.delete_success'), 'success');
    this.closeProfilePictureModal();
  }
}

