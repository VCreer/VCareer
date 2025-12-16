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
  selector: 'app-service-quotation',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './service-quotation.html',
  styleUrls: ['./service-quotation.scss']
})
export class ServiceQuotationComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  serviceSections: ServiceSection[] = [
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
      action: SubcriptionContance_ServiceAction.JobBadge,
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
          action: SubcriptionContance_ServiceAction.JobBadge,
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
          action: SubcriptionContance_ServiceAction.JobBadge,
          target: SubcriptionContance_ServiceTarget.Company
        }
      ]
    },
    {
      title: 'Theme công ty',
      action: SubcriptionContance_ServiceAction.ThemeCompany,
      description: 'Tùy chỉnh giao diện công ty để nổi bật và thu hút ứng viên',
      packages: [
        {
          id: 'theme-company',
          name: 'Theme công ty',
          price: 'Liên hệ',
          priceNumber: 0,
          features: [
            'Tùy chỉnh giao diện công ty',
            'Nổi bật so với đối thủ',
            'Tăng độ nhận diện thương hiệu',
            'Thu hút ứng viên chất lượng'
          ],
          headerColor: '#0f83ba',
          headerGradientStart: '#0f83ba',
          headerGradientEnd: '#0d6fa0',
          isVip: false,
          action: SubcriptionContance_ServiceAction.ThemeCompany,
          target: SubcriptionContance_ServiceTarget.Company
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
