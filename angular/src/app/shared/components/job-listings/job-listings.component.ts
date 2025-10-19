import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { ToastNotificationComponent } from '../toast-notification/toast-notification.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-job-listings',
  standalone: true,
  imports: [CommonModule, FilterBarComponent, ToastNotificationComponent],
  templateUrl: './job-listings.component.html',
  styleUrls: ['./job-listings.component.scss']
})
export class JobListingsComponent {
  @Input() jobListings: any[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() selectedFilter: string = '';
  @Output() pageChange = new EventEmitter<number>();
  @Output() jobClick = new EventEmitter<number>();
  @Output() filterChange = new EventEmitter<string>();
  @Output() locationChange = new EventEmitter<string>();

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

  onFilterChange(filter: string) {
    this.filterChange.emit(filter);
  }

  onLocationChange(location: string) {
    this.locationChange.emit(location);
  }

  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}
