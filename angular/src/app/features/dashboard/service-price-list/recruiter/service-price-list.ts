import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent, ToastNotificationComponent } from '../../../../shared/components';
import { SubcriptionContance_ServiceAction } from '../../../../proxy/constants/job-constant/subcription-contance-service-action.enum';
import { SubcriptionContance_ServiceTarget } from '../../../../proxy/constants/job-constant/subcription-contance-service-target.enum';

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  priceNumber: number;
  features: string[];
  headerColor: string;
  headerGradientStart: string;
  headerGradientEnd: string;
  isVip: boolean;
  action: SubcriptionContance_ServiceAction;
  target: SubcriptionContance_ServiceTarget;
}

interface ServiceSection {
  title: string;
  action: SubcriptionContance_ServiceAction;
  description: string;
  packages: ServicePackage[];
}

@Component({
  selector: 'app-service-price-list',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './service-price-list.html',
  styleUrls: ['./service-price-list.scss']
})
export class ServicePriceListComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  serviceSections: ServiceSection[] = [
    {
      title: 'Tăng điểm hiển thị CV',
      action: SubcriptionContance_ServiceAction.BoostScoreCv,
      description: 'Tăng điểm hiển thị CV của bạn để xuất hiện ở vị trí cao hơn trong kết quả tìm kiếm',
      packages: [
        {
          id: 'boost-cv-jobpost',
          name: 'Tăng điểm CV - Tin tuyển dụng',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tăng điểm hiển thị CV',
            'Xuất hiện ở vị trí cao hơn trong kết quả tìm kiếm',
            'Tăng khả năng được nhà tuyển dụng chú ý',
            'Hiệu quả lâu dài'
          ],
          headerColor: '#3b82f6',
          headerGradientStart: '#3b82f6',
          headerGradientEnd: '#2563eb',
          isVip: false,
          action: SubcriptionContance_ServiceAction.BoostScoreCv,
          target: SubcriptionContance_ServiceTarget.JobPost
        },
        {
          id: 'boost-cv-company',
          name: 'Tăng điểm CV - Công ty',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tăng điểm hiển thị CV',
            'Xuất hiện ở vị trí cao hơn trong kết quả tìm kiếm',
            'Tăng khả năng được nhà tuyển dụng chú ý',
            'Hiệu quả lâu dài'
          ],
          headerColor: '#3b82f6',
          headerGradientStart: '#3b82f6',
          headerGradientEnd: '#2563eb',
          isVip: false,
          action: SubcriptionContance_ServiceAction.BoostScoreCv,
          target: SubcriptionContance_ServiceTarget.Company
        },
        {
          id: 'boost-cv-cv',
          name: 'Tăng điểm CV - CV',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tăng điểm hiển thị CV',
            'Xuất hiện ở vị trí cao hơn trong kết quả tìm kiếm',
            'Tăng khả năng được nhà tuyển dụng chú ý',
            'Hiệu quả lâu dài'
          ],
          headerColor: '#3b82f6',
          headerGradientStart: '#3b82f6',
          headerGradientEnd: '#2563eb',
          isVip: false,
          action: SubcriptionContance_ServiceAction.BoostScoreCv,
          target: SubcriptionContance_ServiceTarget.Cv
        }
      ]
    },
    {
      title: 'Tăng điểm hiển thị Job',
      action: SubcriptionContance_ServiceAction.BoostScoreJob,
      description: 'Tăng điểm hiển thị tin tuyển dụng để thu hút nhiều ứng viên hơn',
      packages: [
        {
          id: 'boost-job-jobpost',
          name: 'Tăng điểm Job - Tin tuyển dụng',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tăng điểm hiển thị tin tuyển dụng',
            'Xuất hiện ở top kết quả tìm kiếm',
            'Tăng số lượng ứng viên xem tin',
            'Tăng tỷ lệ ứng tuyển'
          ],
          headerColor: '#10b981',
          headerGradientStart: '#10b981',
          headerGradientEnd: '#059669',
          isVip: false,
          action: SubcriptionContance_ServiceAction.BoostScoreJob,
          target: SubcriptionContance_ServiceTarget.JobPost
        },
        {
          id: 'boost-job-company',
          name: 'Tăng điểm Job - Công ty',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tăng điểm hiển thị tin tuyển dụng',
            'Xuất hiện ở top kết quả tìm kiếm',
            'Tăng số lượng ứng viên xem tin',
            'Tăng tỷ lệ ứng tuyển'
          ],
          headerColor: '#10b981',
          headerGradientStart: '#10b981',
          headerGradientEnd: '#059669',
          isVip: false,
          action: SubcriptionContance_ServiceAction.BoostScoreJob,
          target: SubcriptionContance_ServiceTarget.Company
        }
      ]
    },
    {
      title: 'Top danh sách',
      action: SubcriptionContance_ServiceAction.TopList,
      description: 'Đưa tin tuyển dụng lên top danh sách để được nhiều ứng viên quan tâm nhất',
      packages: [
        {
          id: 'toplist-jobpost',
          name: 'Top danh sách - Tin tuyển dụng',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Hiển thị ở top danh sách',
            'Ưu tiên hiển thị',
            'Tăng độ tin cậy',
            'Thu hút ứng viên chất lượng'
          ],
          headerColor: '#f59e0b',
          headerGradientStart: '#f59e0b',
          headerGradientEnd: '#d97706',
          isVip: false,
          action: SubcriptionContance_ServiceAction.TopList,
          target: SubcriptionContance_ServiceTarget.JobPost
        },
        {
          id: 'toplist-company',
          name: 'Top danh sách - Công ty',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Hiển thị ở top danh sách',
            'Ưu tiên hiển thị',
            'Tăng độ tin cậy',
            'Thu hút ứng viên chất lượng'
          ],
          headerColor: '#f59e0b',
          headerGradientStart: '#f59e0b',
          headerGradientEnd: '#d97706',
          isVip: false,
          action: SubcriptionContance_ServiceAction.TopList,
          target: SubcriptionContance_ServiceTarget.Company
        }
      ]
    },
    {
      title: 'Gắn badge',
      action: SubcriptionContance_ServiceAction.VerifiedBadge,
      description: 'Gắn badge xác thực cho tin tuyển dụng để tăng độ tin cậy',
      packages: [
        {
          id: 'badge-jobpost',
          name: 'Badge xác thực - Tin tuyển dụng',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Badge xác thực tin tuyển dụng',
            'Tăng độ tin cậy',
            'Thu hút ứng viên',
            'Nổi bật so với đối thủ'
          ],
          headerColor: '#8b5cf6',
          headerGradientStart: '#8b5cf6',
          headerGradientEnd: '#7c3aed',
          isVip: false,
          action: SubcriptionContance_ServiceAction.VerifiedBadge,
          target: SubcriptionContance_ServiceTarget.JobPost
        },
        {
          id: 'badge-company',
          name: 'Badge xác thực - Công ty',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Badge xác thực công ty',
            'Tăng độ tin cậy',
            'Thu hút ứng viên',
            'Nổi bật so với đối thủ'
          ],
          headerColor: '#8b5cf6',
          headerGradientStart: '#8b5cf6',
          headerGradientEnd: '#7c3aed',
          isVip: false,
          action: SubcriptionContance_ServiceAction.VerifiedBadge,
          target: SubcriptionContance_ServiceTarget.Company
        }
      ]
    },
    {
      title: 'Tăng số lượng job được đăng',
      action: SubcriptionContance_ServiceAction.IncreaseQuota,
      description: 'Tăng số lượng tin tuyển dụng được phép đăng trong tháng',
      packages: [
        {
          id: 'increase-quota-jobpost',
          name: 'Tăng hạn mức - Tin tuyển dụng',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tăng số lượng tin được đăng',
            'Linh hoạt trong tuyển dụng',
            'Không giới hạn cơ hội',
            'Phù hợp doanh nghiệp lớn'
          ],
          headerColor: '#ef4444',
          headerGradientStart: '#ef4444',
          headerGradientEnd: '#dc2626',
          isVip: false,
          action: SubcriptionContance_ServiceAction.IncreaseQuota,
          target: SubcriptionContance_ServiceTarget.JobPost
        }
      ]
    },
    {
      title: 'Kéo dài ngày hết hạn job',
      action: SubcriptionContance_ServiceAction.ExtendExpiredDate,
      description: 'Kéo dài thời gian hiển thị tin tuyển dụng để có thêm thời gian tuyển dụng',
      packages: [
        {
          id: 'extend-date-jobpost',
          name: 'Gia hạn ngày hết hạn - Tin tuyển dụng',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Gia hạn thời gian đăng tin',
            'Tăng cơ hội tìm ứng viên',
            'Tiết kiệm chi phí',
            'Linh hoạt thời gian'
          ],
          headerColor: '#0f83ba',
          headerGradientStart: '#0f83ba',
          headerGradientEnd: '#0d6fa0',
          isVip: false,
          action: SubcriptionContance_ServiceAction.ExtendExpiredDate,
          target: SubcriptionContance_ServiceTarget.JobPost
        }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || rect.width > 100;
    } else {
      this.sidebarWidth = 0;
      this.sidebarExpanded = false;
    }
  }

  getContentPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return 'calc(100vw - 32px)';
    }
    const sidePadding = 48;
    const availableWidth = viewportWidth - this.sidebarWidth - sidePadding;
    const maxContentWidth = Math.min(1400, Math.max(900, availableWidth));
    return `${maxContentWidth}px`;
  }

  onContactUs(pkg: ServicePackage): void {
    this.showToastMessage('info', `Liên hệ với chúng tôi để biết thêm về gói "${pkg.name}"`);
    // TODO: Implement contact functionality
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  onRequestQuote(): void {
    this.showToastMessage('info', 'Vui lòng liên hệ với chúng tôi để nhận báo giá chi tiết');
    // TODO: Implement request quote functionality
  }

  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }
}

