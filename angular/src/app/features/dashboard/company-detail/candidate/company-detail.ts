import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

export interface CompanyDetail {
  id: string;
  name: string;
  fullName: string;
  logo: string;
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
  imports: [CommonModule, FormsModule, RouterLink, ButtonComponent, ToastNotificationComponent],
  templateUrl: './company-detail.html',
  styleUrls: ['./company-detail.scss']
})
export class CompanyDetailComponent implements OnInit {
  companyId: string = '';
  company: CompanyDetail | null = null;
  isLoading: boolean = false;
  isDescriptionExpanded: boolean = true;
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
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.companyId = params['id'];
      this.loadCompanyDetail();
    });
  }

  loadCompanyDetail() {
    this.isLoading = true;
    // TODO: Load company detail from API
    // Mock data for now
    setTimeout(() => {
      this.company = {
        id: this.companyId,
        name: 'VIETTEL',
        fullName: 'TẬP ĐOÀN CÔNG NGHIỆP - VIỄN THÔNG QUÂN ĐỘI',
        logo: 'assets/images/viettel-logo.png',
        bannerImage: 'assets/images/company/viettel-banner.jpg',
        website: 'tuyendung.viettel.vn',
        employees: 5000,
        followers: 6284,
        address: 'Lô D26 khu đô thị mới Cầu Giấy, phường Yên Hoà, quận Cầu Giấy, thành phố Hà Nội, Việt Nam.',
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.863981043327!2d105.8012024148839!3d21.028815685996353!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4e0b3c8f1b%3A0x9b3e8a5d9f5f5f5f!2zVOG7qyBOaMOgbmcgdmllbnRlbA!5e0!3m2!1svi!2s!4v1234567890',
        description: `Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel) là một trong những nhà tuyển dụng hàng đầu tại Việt Nam, với mạng lưới hoạt động rộng khắp tại nhiều quốc gia trên thế giới bao gồm châu Á, châu Mỹ và châu Phi. Với gần 70.000 nhân viên trên toàn cầu, Viettel không chỉ là một trong những tập đoàn viễn thông lớn nhất Việt Nam mà còn là một trong những công ty công nghệ hàng đầu trong khu vực.

Viettel đang đẩy mạnh đầu tư vào các lĩnh vực công nghệ cao, bao gồm nghiên cứu và phát triển các ứng dụng công nghệ số, phát triển các giải pháp công nghệ thông tin, và đặc biệt là lĩnh vực hàng không vũ trụ. Với cam kết đổi mới và phát triển bền vững, Viettel luôn chú trọng đến việc phát triển nguồn nhân lực chất lượng cao và tạo môi trường làm việc chuyên nghiệp, năng động.

Tầm nhìn của Viettel là trở thành một tập đoàn công nghiệp và công nghệ đẳng cấp thế giới, góp phần đưa Việt Nam trở thành quốc gia có nền công nghệ phát triển hàng đầu trong khu vực và trên thế giới.`,
        isProCompany: true,
        isFollowing: false
      };
      this.isLoading = false;
      // TODO: Load jobs from BE API when connected
      // this.loadJobsFromBE();
    }, 500);
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
      const matchesKeyword = !this.jobSearchKeyword || 
        job.title.toLowerCase().includes(this.jobSearchKeyword.toLowerCase());
      const matchesLocation = !this.selectedLocation || 
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
    navigator.clipboard.writeText(url).then(() => {
      this.showToastMessage('Đã sao chép đường dẫn', 'success');
    }).catch(() => {
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
}

