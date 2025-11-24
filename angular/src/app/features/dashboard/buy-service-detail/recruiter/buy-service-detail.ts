import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';
// import { CartService } from '../../../../core/services/cart.service'; // TODO: Uncomment when cart feature is needed
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

interface ServiceDetail {
  id: string;
  title: string;
  price: string;
  description: string;
  validityPeriod: string;
  gift: string;
  promotionalOffers: string[];
  countdown: {
    days: number;
    hours: number;
    minutes: number;
  };
  isTrial?: boolean;
  isVip?: boolean;
}

@Component({
  selector: 'app-buy-service-detail',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './buy-service-detail.html',
  styleUrls: ['./buy-service-detail.scss']
})
export class BuyServiceDetailComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  sidebarExpanded: boolean = false;
  serviceId: string = '';
  serviceDetail: ServiceDetail | null = null;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
  private sidebarCheckInterval?: any;

  // Mock data - in real app, this would come from a service
  private serviceData: { [key: string]: ServiceDetail } = {
    'top-max-trial': {
      id: 'top-max-trial',
      title: 'TOP MAX TRIAL',
      price: '2,887,500',
      description: 'Trải nghiệm đăng tin tuyển dụng hiệu quả với vị trí nổi bật trong Việc làm tốt nhất kết hợp cùng các dịch vụ cao cấp, giá dùng thử hấp dẫn',
      validityPeriod: '1 tuần',
      gift: '250 Credits',
      isTrial: true,
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 25% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu',
        'Tặng kèm gói hỗ trợ tư vấn 24/7',
        'Giảm 20% tổng giá trị đơn hàng'
      ]
    },
    'top-pro-trial': {
      id: 'top-pro-trial',
      title: 'TOP PRO TRIAL',
      price: '2,448,000',
      description: 'Trải nghiệm đăng tin tuyển dụng tối ưu với vị trí ưu tiên trong Việc làm hấp dẫn kết hợp cùng các dịch vụ cao cấp, giá dùng thử hấp dẫn',
      validityPeriod: '1 tuần',
      gift: '200 Credits',
      isTrial: true,
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 20% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu',
        'Tặng kèm gói hỗ trợ tư vấn 24/7'
      ]
    },
    'top-eco-plus-trial': {
      id: 'top-eco-plus-trial',
      title: 'TOP ECO PLUS TRIAL',
      price: '2,112,000',
      description: 'Trải nghiệm đăng tin tuyển dụng tiết kiệm với vị trí hiển thị trong Đề xuất việc làm liên quan kết hợp cùng các dịch vụ khác, giá dùng thử hấp dẫn',
      validityPeriod: '1 tuần',
      gift: '150 Credits',
      isTrial: true,
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 15% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu'
      ]
    },
    'top-max-plus': {
      id: 'top-max-plus',
      title: 'TOP MAX PLUS',
      price: '9,650,000',
      description: 'Đăng tin tuyển dụng hiệu quả với vị trí nổi bật trong Việc làm tốt nhất, x2 lượt đấy Top, được sử dụng tỉnh năng CV để xuất kết hợp các dịch vụ cao cấp và được bảo hành với nhiều quyền lợi ưu tiên.',
      validityPeriod: '1 tháng',
      gift: '500 Credits',
      isVip: true,
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 30% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu',
        'Tặng kèm gói hỗ trợ tư vấn 24/7',
        'Ưu đãi đặc biệt cho khách hàng VIP'
      ]
    },
    'top-max': {
      id: 'top-max',
      title: 'TOP MAX',
      price: '7,500,000',
      description: 'Đăng tin tuyển dụng hiệu quả với vị trí nổi bật trong Việc làm tốt nhất, được sử dụng tính năng CV để xuất kết hợp các dịch vụ cao cấp và được bảo hành với nhiều quyền lợi ưu tiên.',
      validityPeriod: '1 tháng',
      gift: '400 Credits',
      isVip: true,
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 25% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu',
        'Tặng kèm gói hỗ trợ tư vấn 24/7'
      ]
    },
    'top-pro': {
      id: 'top-pro',
      title: 'TOP PRO',
      price: '5,440,000',
      description: 'Đăng tin tuyển dụng tối ưu với vị trí ưu tiên trong Việc làm hấp dẫn, được sử dụng tính năng CV đề xuất kết hợp các dịch vụ cao cấp và được bảo hành.',
      validityPeriod: '1 tháng',
      gift: '300 Credits',
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 20% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu'
      ]
    },
    'top-eco-plus': {
      id: 'top-eco-plus',
      title: 'TOP ECO PLUS',
      price: '4,400,000',
      description: 'Đăng tin tuyển dụng tiết kiệm với vị trí hiển thị trong Đề xuất việc làm liên quan, được sử dụng tính năng CV để xuất kết hợp các dịch vụ khác và được bảo hành.',
      validityPeriod: '1 tháng',
      gift: '250 Credits',
      countdown: {
        days: 23,
        hours: 2,
        minutes: 9
      },
      promotionalOffers: [
        'Giảm 15% tổng giá trị đơn hàng',
        'Miễn phí vận chuyển cho đơn hàng trên 5 triệu'
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translationService: TranslationService
    // private cartService: CartService // TODO: Uncomment when cart feature is needed
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Get service ID from route
    this.route.params.subscribe(params => {
      this.serviceId = params['id'] || '';
      this.loadServiceDetail();
    });

    // Check sidebar state periodically
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  ngOnDestroy() {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  loadServiceDetail() {
    if (this.serviceId && this.serviceData[this.serviceId]) {
      this.serviceDetail = this.serviceData[this.serviceId];
    } else {
      // If service not found, redirect back
      this.router.navigate(['/recruiter/buy-services']);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onBack(): void {
    this.router.navigate(['/recruiter/buy-services']);
  }

  onAddToCart(): void {
    // TODO: Implement cart functionality when needed
    // if (this.serviceDetail) {
    //   const added = this.cartService.addToCart({
    //     id: this.serviceDetail.id,
    //     title: this.serviceDetail.title,
    //     price: this.serviceDetail.price,
    //     originalPrice: parseFloat(this.serviceDetail.price.replace(/,/g, ''))
    //   });
    //
    //   if (added) {
    //     this.showToastMessage('success', `Đã thêm "${this.serviceDetail.title}" vào giỏ hàng`);
    //   }
    // }
    this.showToastMessage('info', 'Tính năng giỏ hàng đang được phát triển');
  }

  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onBuyNow(): void {
    // TODO: Implement buy now functionality
  }
}
