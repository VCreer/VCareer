import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { 
  CvFilterBarComponent,
  CvFilterData,
  ButtonComponent, 
  ToastNotificationComponent,
  CvEmptyStateComponent
} from '../../../shared/components';

export interface CandidateCv {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: string;
  source: string;
  appliedDate: string;
  campaign?: string;
  labels?: string[];
}

@Component({
  selector: 'app-recruiter-cv-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CvFilterBarComponent,
    CvEmptyStateComponent,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './cv-management.html',
  styleUrls: ['./cv-management.scss']
})
export class RecruiterCvManagementComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;

  // Filter data
  campaigns: { id: string; name: string }[] = [
    { id: '1', name: 'Chiến dịch Tuyển dụng Q1 2025' },
    { id: '2', name: 'Chiến dịch Tuyển dụng Q2 2025' },
    { id: '3', name: 'Chiến dịch Tuyển dụng Q3 2025' }
  ];

  statuses: { id: string; name: string }[] = [
    { id: 'new', name: 'Mới' },
    { id: 'reviewing', name: 'Đang xem xét' },
    { id: 'interviewing', name: 'Đang phỏng vấn' },
    { id: 'offered', name: 'Đã đề xuất' },
    { id: 'hired', name: 'Đã tuyển' },
    { id: 'rejected', name: 'Đã từ chối' }
  ];

  sources: { id: string; name: string }[] = [
    { id: 'website', name: 'Website' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'referral', name: 'Giới thiệu' },
    { id: 'other', name: 'Khác' }
  ];

  labels: { id: string; name: string }[] = [
    { id: 'hot', name: 'Hot' },
    { id: 'priority', name: 'Ưu tiên' },
    { id: 'follow-up', name: 'Cần follow-up' }
  ];

  // CV list
  candidateCvs: CandidateCv[] = [];
  filteredCvs: CandidateCv[] = [];
  loading = false;
  totalCount = 0;

  // Current filters
  currentFilters: CvFilterData = {
    searchKeyword: '',
    campaignId: '',
    statusId: '',
    sourceId: '',
    displayAll: true,
    labelId: '',
    timeRange: ''
  };

  constructor(
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    this.loadCvs();
    this.checkSidebarState();
    // Check sidebar state periodically
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
    }
  }

  loadCvs(): void {
    this.loading = true;
    // TODO: Call API to load CVs
    // For now, use empty list
    setTimeout(() => {
      this.candidateCvs = [];
      this.filteredCvs = [];
      this.totalCount = 0;
      this.loading = false;
      this.applyFilters();
    }, 500);
  }

  onFilterChange(filterData: CvFilterData): void {
    this.currentFilters = filterData;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.candidateCvs];

    // Search filter
    if (this.currentFilters.searchKeyword.trim()) {
      const keyword = this.currentFilters.searchKeyword.toLowerCase();
      result = result.filter(cv =>
        cv.name.toLowerCase().includes(keyword) ||
        cv.email.toLowerCase().includes(keyword) ||
        cv.phone.includes(keyword)
      );
    }

    // Campaign filter
    if (this.currentFilters.campaignId) {
      result = result.filter(cv => cv.campaign === this.currentFilters.campaignId);
    }

    // Status filter
    if (this.currentFilters.statusId) {
      result = result.filter(cv => cv.status === this.currentFilters.statusId);
    }

    // Source filter
    if (this.currentFilters.sourceId) {
      result = result.filter(cv => cv.source === this.currentFilters.sourceId);
    }

    // Label filter
    if (this.currentFilters.labelId) {
      result = result.filter(cv =>
        cv.labels && cv.labels.includes(this.currentFilters.labelId)
      );
    }

    // Time range filter
    if (this.currentFilters.timeRange) {
      const now = new Date();
      result = result.filter(cv => {
        const appliedDate = new Date(cv.appliedDate);
        switch (this.currentFilters.timeRange) {
          case 'today':
            return appliedDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appliedDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return appliedDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return appliedDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    this.filteredCvs = result;
    this.totalCount = result.length;
  }

  onExportCvList(): void {
    // TODO: Implement export functionality
    this.showToastMessage('Đang xuất danh sách CV...', 'info');
    // Simulate export
    setTimeout(() => {
      this.showToastMessage('Xuất danh sách CV thành công!', 'success');
    }, 1000);
  }

  viewCv(cvId: string): void {
    // TODO: Navigate to CV detail page or open modal
    this.showToastMessage('Đang mở CV...', 'info');
  }

  editCv(cvId: string): void {
    // TODO: Navigate to edit CV page or open modal
    this.showToastMessage('Đang mở chỉnh sửa CV...', 'info');
  }

  deleteCv(cvId: string): void {
    // TODO: Implement delete functionality
    if (confirm('Bạn có chắc chắn muốn xóa CV này?')) {
      this.candidateCvs = this.candidateCvs.filter(cv => cv.id !== cvId);
      this.applyFilters();
      this.showToastMessage('Xóa CV thành công!', 'success');
    }
  }

  getStatusName(statusId: string): string {
    const status = this.statuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
  }

  getSourceName(sourceId: string): string {
    const source = this.sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }
}

