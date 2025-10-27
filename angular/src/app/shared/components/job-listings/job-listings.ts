import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import { TranslationService } from '../../../core/services/translation.service';
import { CategoryTreeDto } from '../../../proxy/api/category.service';
import { ProvinceDto } from '../../../proxy/api/location.service';

@Component({
  selector: 'app-job-listings',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],  // ✅ Removed FilterBar (moved to hero-section)
  templateUrl: './job-listings.html',
  styleUrls: ['./job-listings.scss']
})
export class JobListingsComponent {
  @Input() jobListings: any[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() categories: CategoryTreeDto[] = [];  // ← NEW: Categories từ API
  @Input() provinces: ProvinceDto[] = [];       // ← NEW: Provinces từ API
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() jobClick = new EventEmitter<number>();
  @Output() categorySelected = new EventEmitter<string[]>();  // ← NEW
  @Output() locationSelected = new EventEmitter<{provinceIds: number[], districtIds: number[]}>();  // ← NEW

  defaultLogo = 'assets/images/home/company-placeholder.png';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = this.defaultLogo;
  }

  toggleBookmark(job: any) {
    job.isBookmarked = !job.isBookmarked;
    if (job.isBookmarked) {
      this.toastType = 'success';
      this.toastMessage = 'Lưu tin thành công';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 2500);
    } else {
      // Không hiển thị toast khi bỏ lưu theo yêu cầu
      this.showToast = false;
    }
  }

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }

  onJobClick(jobId: number) {
    this.jobClick.emit(jobId);
  }

  onCategorySelected(categoryIds: string[]) {
    this.categorySelected.emit(categoryIds);
  }

  onLocationSelected(location: {provinceIds: number[], districtIds: number[]}) {
    this.locationSelected.emit(location);
  }

  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}
