import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { SearchHeaderComponent } from '../../../../shared/components/search-header/search-header';
import { ApplyJobModalComponent } from '../../../../shared/components/apply-job-modal/apply-job-modal';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastNotificationComponent, SearchHeaderComponent, ApplyJobModalComponent],
  templateUrl: './job-detail.html',
  styleUrls: ['./job-detail.scss']
})
export class JobDetailComponent implements OnInit {
  selectedLanguage: string = 'vi';
  isHeartActive: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  selectedCategory: string = '';
  selectedLocation: string = '';
  searchPosition: string = '';
  showApplyModal: boolean = false;

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  toggleHeart(): void {
    this.isHeartActive = !this.isHeartActive;
    if (this.isHeartActive) {
      this.toastMessage = this.translate('job_detail.save_success');
    } else {
      this.toastMessage = this.translate('job_detail.unsave_success');
    }
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value;
  }

  onLocationChange(event: any): void {
    this.selectedLocation = event.target.value;
  }

  onPositionChange(event: any): void {
    this.searchPosition = event.target.value;
  }

  onSearch(): void {
    console.log('Search with params:', {
      category: this.selectedCategory,
      location: this.selectedLocation,
      position: this.searchPosition
    });
  }

  onClearPosition(): void {
    this.searchPosition = '';
  }

  openApplyModal(): void {
    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  onModalSubmit(data: {cvOption: string, showToast: boolean, toastMessage: string}): void {
    console.log('Submitting application with:', {
      cvOption: data.cvOption
    });
    
    // Show toast notification
    if (data.showToast) {
      this.toastMessage = data.toastMessage;
      this.showToast = true;
    }
  }
}
