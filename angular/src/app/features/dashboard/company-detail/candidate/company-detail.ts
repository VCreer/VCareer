import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { SafeUrlPipe } from '../../../../shared/pipes/safe-url.pipe';
import { CompanyService, CompanyLegalInfoDto } from '../../../../apiTest/api/company.service';
import { environment } from '../../../../../environments/environment';
export interface CompanyDetail {
  id: string;
  name: string;
  fullName: string;
  logoUrl: string;
  bannerImage?: string;
  website?: string;
  employees?: number;
  followers?: number;
  address?: string;
  mapUrl?: string;
  description: string;
  isProCompany: boolean;
  isFollowing: boolean;
}

export interface JobListing {
  id: string;
  title: string;
  companyName: string;
  logo?: string;
  location: string;
  salary: string;
  daysRemaining: number;
  isPro: boolean;
  isFavorite: boolean;
}

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonComponent,
    ToastNotificationComponent,
    SafeUrlPipe,
  ],
  templateUrl: './company-detail.html',
  styleUrls: ['./company-detail.scss'],
})
export class CompanyDetailComponent implements OnInit {
  companyId: string = '';
  company: CompanyDetail | null = null;
  isLoading: boolean = false;
  isDescriptionExpanded: boolean = true;
  showMapModal: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';

  // Job listing properties
  jobSearchKeyword: string = '';
  selectedLocation: string = '';
  allJobs: JobListing[] = [];
  filteredJobs: JobListing[] = [];
  hasJobsFromBE: boolean = false; // TODO: Set to true when BE is connected

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translationService: TranslationService,
    private companyApi: CompanyService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.companyId = params['id'];
      this.loadCompanyDetail();
    });
  }

  loadCompanyDetail() {
    this.isLoading = true;
    const idForApi = this.companyId;
    this.companyApi.getCompanyById(idForApi).subscribe({
      next: (dto: CompanyLegalInfoDto) => {
        this.company = {
          id: String(dto.id),
          name: dto.companyName || '',
          fullName: dto.companyName || '',
          logoUrl: this.getLogoUrl(dto.logoUrl),
          bannerImage: dto.coverImageUrl ? this.buildLogoUrl(dto.coverImageUrl) : undefined,
          website: dto.websiteUrl || undefined,
          employees: dto.companySize || 0,
          followers: 0,
          address: dto.headquartersAddress || '',
          description: dto.description || '',
          isProCompany: true,
          isFollowing: false,
        };
        this.isLoading = false;
      },
      error: _ => {
        this.isLoading = false;
      },
    });
  }

  private getBackendBaseUrl(): string {
    const backendUrl = environment.apis?.default?.url || 'https://localhost:44385';
    return backendUrl.replace(/\/$/, '');
  }

  getLogoUrl(logoUrl: string | undefined): string {
    if (!logoUrl) {
      return '/assets/images/default-company-logo.png';
    }

    // Remove single quotes if present
    let cleanUrl = logoUrl.trim();
    if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'")) {
      cleanUrl = cleanUrl.slice(1, -1);
    }

    // Nếu đã là full URL, return as is
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Nếu bắt đầu bằng /, đó là relative path từ wwwroot
    if (cleanUrl.startsWith('/')) {
      const backendBaseUrl = this.getBackendBaseUrl();
      return `${backendBaseUrl}${cleanUrl}`;
    }
  }

  private buildLogoUrl(path?: string): string {
    if (!path) return 'assets/images/default-company.png';
    const trimmed = path.trim().replace(/^'|'$/g, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const base = (window as any).environment?.apis?.default?.url || '';
    const backend = base || (window as any)['BACKEND_URL'] || '';
    const normalizedBase = backend.replace(/\/$/, '');
    if (trimmed.startsWith('/')) return `${normalizedBase}${trimmed}`;
    return `${normalizedBase}/${trimmed}`;
  }

  // TODO: Implement when BE is connected
  // loadJobsFromBE() {
  //   // Call API to get jobs for this company
  //   // this.jobService.getJobsByCompanyId(this.companyId).subscribe(jobs => {
  //   //   this.allJobs = jobs;
  //   //   this.filteredJobs = [...this.allJobs];
  //   //   this.hasJobsFromBE = true;
  //   // });
  // }

  onSearchJobs() {
    if (!this.hasJobsFromBE) return;

    // TODO: Implement search with BE API or filter local data
    this.filteredJobs = this.allJobs.filter(job => {
      const matchesKeyword =
        !this.jobSearchKeyword ||
        job.title.toLowerCase().includes(this.jobSearchKeyword.toLowerCase());
      const matchesLocation =
        !this.selectedLocation ||
        job.location.toLowerCase().includes(this.selectedLocation.toLowerCase());
      return matchesKeyword && matchesLocation;
    });
  }

  onApplyJob(job: JobListing) {
    // TODO: Navigate to apply job page
    this.router.navigate(['/candidate/job-detail', job.id]);
  }

  toggleFavorite(job: JobListing) {
    if (!this.hasJobsFromBE) return;

    // TODO: Call BE API to toggle favorite
    job.isFavorite = !job.isFavorite;
    if (job.isFavorite) {
      this.showToastMessage('Đã thêm vào danh sách yêu thích', 'success');
    } else {
      this.showToastMessage('Đã xóa khỏi danh sách yêu thích', 'info');
    }
  }

  toggleDescription() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  onApplyNow() {
    // TODO: Navigate to apply job or show apply modal
    this.showToastMessage('Chuyển đến trang ứng tuyển', 'info');
  }

  onFollowCompany() {
    if (this.company) {
      this.company.isFollowing = !this.company.isFollowing;
      if (this.company.isFollowing) {
        this.showToastMessage('Đã theo dõi công ty thành công', 'success');
      } else {
        this.showToastMessage('Đã bỏ theo dõi công ty', 'info');
      }
    }
  }

  onCopyLink() {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.showToastMessage('Đã sao chép đường dẫn', 'success');
      })
      .catch(() => {
        this.showToastMessage('Không thể sao chép đường dẫn', 'error');
      });
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning') {
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

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getDescriptionParagraphs(): string[] {
    if (!this.company) return [];
    return this.company.description.split('\n').filter(p => p.trim().length > 0);
  }

  getWebsiteUrl(website?: string): string {
    if (!website) return '#';
    // Nếu website đã có protocol, giữ nguyên
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    // Nếu chưa có protocol, thêm https://
    return `https://${website}`;
  }

  // ===== Google Maps helpers =====
  getMapEmbedUrl(): string {
    if (!this.company) return '';
    // Prefer explicit mapUrl if provided
    if (this.company.mapUrl) return this.company.mapUrl;
    // Build simple embed URL from address
    const q = encodeURIComponent(this.company.address || '');
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }

  openMapModal() {
    this.showMapModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeMapModal() {
    this.showMapModal = false;
    document.body.style.overflow = '';
  }
}
