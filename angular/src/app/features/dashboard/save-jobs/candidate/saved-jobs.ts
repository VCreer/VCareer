import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { NavigationService } from '../../../../core/services/navigation.service';
import { take } from 'rxjs/operators';
import { JobSearchService } from '../../../../proxy/services/job/job-search.service';
import { SavedJobDto } from '../../../../proxy/dto/job/models';
import { GeoService } from '../../../../proxy/services/geo/geo.service';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './saved-jobs.html',
  styleUrls: ['./saved-jobs.scss']
})
export class SavedJobsComponent implements OnInit {
  savedJobs: SavedJobDto[] = [];
  loading = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  totalCount = 0;
  // Map để lưu province name và logo cho mỗi job
  jobProvinceNames: Map<string, string> = new Map();
  jobLogos: Map<string, string> = new Map();
  // Map để track logo load errors
  logoLoadErrors: Set<string> = new Set();

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private jobSearchService: JobSearchService,
    private geoService: GeoService
  ) {}

  ngOnInit() {
    // Check authentication trước khi load data
    // Sử dụng take(1) để chỉ lấy giá trị đầu tiên và tự động unsubscribe
    this.navigationService.isLoggedIn$.pipe(take(1)).subscribe(isLoggedIn => {
      if (!isLoggedIn) {
        // Nếu chưa đăng nhập, redirect đến route 404
        this.router.navigate(['/404']);
        return;
      }
      // Nếu đã đăng nhập, load data
      this.loadSavedJobs();
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getJobsCountText(): string {
    const count = this.savedJobs.length;
    if (count === 0) {
      return this.translate('saved_jobs.no_jobs_count');
    } else if (count === 1) {
      return this.translate('saved_jobs.list_count_one');
    } else {
      return this.translate('saved_jobs.list_count').replace('{{count}}', count.toString());
    }
  }

  loadSavedJobs() {
    this.loading = true;
    this.jobSearchService.getSavedJobs(0, 100).subscribe({
      next: (result) => {
        this.savedJobs = result.items || [];
        this.totalCount = result.totalCount || 0;
        
        // Load province names và logos cho tất cả jobs
        this.savedJobs.forEach(job => {
          if (job.jobId) {
            this.loadProvinceName(job);
            this.loadCompanyLogo(job);
          }
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading saved jobs:', error);
        this.loading = false;
        this.showToastMessage('Không thể tải danh sách công việc đã lưu', 'error');
      }
    });
  }

  /**
   * Load province name từ provinceCode
   */
  private loadProvinceName(job: SavedJobDto): void {
    if (!job.jobId) return;
    
    const detail = job.jobDetail as any;
    const provinceCode = detail?.provinceCode;
    
    if (provinceCode) {
      this.geoService.getProvinceNameByCodeByProvinceCode(provinceCode)
        .pipe(
          catchError(error => {
            console.error(`Error getting province name for code ${provinceCode}:`, error);
            return of('');
          })
        )
        .subscribe(provinceName => {
          if (provinceName) {
            this.jobProvinceNames.set(job.jobId!, provinceName);
          }
        });
    }
  }

  /**
   * Load company logo từ jobDetail
   */
  private loadCompanyLogo(job: SavedJobDto): void {
    if (!job.jobId) return;
    
    const detail = job.jobDetail as any;
    const companyImageUrl = detail?.companyImageUrl;
    
    if (companyImageUrl && companyImageUrl.trim() !== '') {
      this.jobLogos.set(job.jobId!, this.formatCompanyLogoUrl(companyImageUrl));
    }
  }

  onApplyJob(job: SavedJobDto) {
    if (this.isJobExpired(job)) {
      this.showToastMessage('Công việc đã hết hạn nộp, bạn không thể ứng tuyển.', 'warning');
      return;
    }
    this.router.navigate(['/candidate/job-detail', job.jobId], { 
      queryParams: { openApplyModal: 'true' } 
    });
  }

  /**
   * Navigate to job detail khi click vào job title
   */
  onJobTitleClick(job: SavedJobDto) {
    if (this.isJobExpired(job)) {
      this.showToastMessage('Công việc đã hết hạn nộp, bạn không thể xem chi tiết.', 'warning');
      return;
    }
    this.router.navigate(['/candidate/job-detail', job.jobId]);
  }

  onUnsaveJob(job: SavedJobDto) {
    // Logic giống hệt như ở job detail
    if (!job.jobId) {
      return;
    }

    this.jobSearchService.unsaveJob(job.jobId).subscribe({
      next: () => {
        // Remove from list
        this.savedJobs = this.savedJobs.filter(j => j.jobId !== job.jobId);
        this.totalCount--;
        this.showToastMessage('Đã bỏ lưu công việc thành công', 'success');
      },
      error: (error) => {
        console.error('Error unsaving job:', error);
        this.showToastMessage('Không thể bỏ lưu công việc', 'error');
      }
    });
  }

  trackByJobId(index: number, job: SavedJobDto): string {
    return job.jobId;
  }

  /**
   * Format saved date - Backend trả về UTC, convert sang múi giờ Việt Nam (UTC+7)
   */
  formatSavedDate(savedAt: Date | string): string {
    if (!savedAt) return '';
    
    try {
      // Parse date
      let date: Date;
      if (typeof savedAt === 'string') {
        // Nếu string có 'Z' (UTC), parse và giữ nguyên UTC
        // Nếu không có timezone, assume là UTC
        const dateStr = savedAt.includes('T') && !savedAt.includes('+') && !savedAt.includes('Z') 
          ? savedAt + 'Z' 
          : savedAt;
        date = new Date(dateStr);
      } else {
        date = new Date(savedAt);
      }
      
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', savedAt);
        return '';
      }
      
      // Lấy UTC components
      const utcYear = date.getUTCFullYear();
      const utcMonth = date.getUTCMonth();
      const utcDate = date.getUTCDate();
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      
      // Cộng thêm 7 giờ cho múi giờ Việt Nam
      let vnHours = utcHours + 7;
      let vnDate = utcDate;
      let vnMonth = utcMonth;
      let vnYear = utcYear;
      
      // Xử lý overflow (nếu > 24h, chuyển sang ngày hôm sau)
      if (vnHours >= 24) {
        vnHours -= 24;
        vnDate++;
        // Xử lý tháng/năm overflow nếu cần
        const daysInMonth = new Date(vnYear, vnMonth + 1, 0).getDate();
        if (vnDate > daysInMonth) {
          vnDate = 1;
          vnMonth++;
          if (vnMonth > 11) {
            vnMonth = 0;
            vnYear++;
          }
        }
      }
      
      // Format
      const day = String(vnDate).padStart(2, '0');
      const month = String(vnMonth + 1).padStart(2, '0');
      const year = vnYear;
      const hours = String(vnHours).padStart(2, '0');
      const minutes = String(utcMinutes).padStart(2, '0');
      
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error, savedAt);
      return '';
    }
  }

  /**
   * Get company logo text (first 2-3 words) cho placeholder
   */
  getCompanyLogoText(companyName: string): string {
    if (!companyName) return 'SM';
    const words = companyName.trim().split(/\s+/);
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
    }
    return companyName.substring(0, 2).toUpperCase();
  }

  /**
   * Get province name - chỉ hiển thị tên tỉnh/thành phố, không hiển thị địa chỉ chi tiết
   */
  getProvinceName(job: SavedJobDto): string {
    if (!job.jobId) return 'N/A';
    
    // Ưu tiên lấy từ map (đã load từ provinceCode)
    const provinceName = this.jobProvinceNames.get(job.jobId);
    if (provinceName) {
      return provinceName;
    }
    
    // Fallback: nếu chưa load xong, thử lấy từ jobDetail
    const detail: any = job.jobDetail as any;
    if (detail?.provinceName) {
      return detail.provinceName;
    }
    
    return 'N/A';
  }

  /**
   * Get company logo URL
   */
  getCompanyLogoUrl(job: SavedJobDto): string {
    if (!job.jobId) return '';
    
    // Nếu logo đã bị lỗi khi load, không hiển thị
    if (this.logoLoadErrors.has(job.jobId)) {
      return '';
    }
    
    // Lấy từ map nếu đã load
    const logo = this.jobLogos.get(job.jobId);
    if (logo) {
      return logo;
    }
    
    // Fallback: lấy từ jobDetail
    const detail: any = job.jobDetail as any;
    const companyImageUrl = detail?.companyImageUrl;
    if (companyImageUrl && companyImageUrl.trim() !== '') {
      return this.formatCompanyLogoUrl(companyImageUrl);
    }
    
    return '';
  }

  /**
   * Handle logo load error
   */
  onLogoError(job: SavedJobDto): void {
    if (job.jobId) {
      this.logoLoadErrors.add(job.jobId);
    }
  }

  /**
   * Format logo URL của công ty
   */
  private formatCompanyLogoUrl(logoUrl: string | undefined | null): string {
    if (!logoUrl || logoUrl.trim() === '') {
      return '';
    }

    let cleanUrl = logoUrl.trim().replace(/^'|'$/g, '');
    
    if (cleanUrl === '') {
      return '';
    }

    // Nếu đã là full URL (http/https), return as is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Logo được lưu trong blob storage với StoragePath
    const baseUrl = environment.apis?.default?.url || (window as any).environment?.apis?.default?.url || 'https://localhost:44385';
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const encodedStoragePath = encodeURIComponent(cleanUrl);
    return `${normalizedBase}/api/profile/company-legal-info/company-logo?storagePath=${encodedStoragePath}`;
  }

  /**
   * Text hiển thị hạn nộp cho từng job đã lưu
   * - Nếu đã hết hạn: 'Đã hết hạn nộp'
   * - Nếu còn ≤ 20 ngày: 'Còn X ngày' (0: Hết hạn hôm nay)
   * - Nếu > 20 ngày: 'Ngày hết hạn: dd/MM/yyyy'
   */
  getDeadlineText(job: SavedJobDto): string {
    // TS model JobViewDto hiện chưa khai báo expiresAt, nên cast any để đọc trường backend trả về
    const expiresAt = (job.jobDetail as any)?.expiresAt;
    if (!expiresAt) {
      return '';
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) {
      return '';
    }

    // Tính số ngày chênh lệch (lấy theo ngày, bỏ phần giờ)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const diffMs = startOfExpiry.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Đã hết hạn nộp';
    }

    if (diffDays === 0) {
      return 'Hết hạn hôm nay';
    }

    if (diffDays <= 20) {
      if (diffDays === 1) {
        return 'Còn 1 ngày';
      }
      return `Còn ${diffDays} ngày`;
    }

    // > 20 ngày: hiển thị ngày hết hạn dạng dd/MM/yyyy
    const day = String(startOfExpiry.getDate()).padStart(2, '0');
    const month = String(startOfExpiry.getMonth() + 1).padStart(2, '0');
    const year = startOfExpiry.getFullYear();
    return `Ngày hết hạn: ${day}/${month}/${year}`;
  }

  /**
   * Kiểm tra job đã hết hạn chưa (dùng để chặn click)
   */
  isJobExpired(job: SavedJobDto): boolean {
    const expiresAt = (job.jobDetail as any)?.expiresAt;
    if (!expiresAt) {
      return false;
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) {
      return false;
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const diffMs = startOfExpiry.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return diffDays < 0;
  }

  onBrowseJobs() {
    this.router.navigate(['/candidate/job']);
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
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
}

