import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';
import { ButtonComponent } from '../../../../shared/components/button/button';

interface ServicePackage {
  id: string;
  title: string;
  price: string;
  description: string;
  isVip?: boolean;
  isTrial?: boolean;
}

@Component({
  selector: 'app-buy-services',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './buy-services.html',
  styleUrls: ['./buy-services.scss']
})
export class BuyServicesComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  sidebarExpanded: boolean = false;
  private routerSubscription?: Subscription;
  private sidebarCheckInterval?: any;

  trialPackages: ServicePackage[] = [
    {
      id: 'top-max-trial',
      title: 'TOP MAX TRIAL',
      price: '2,887,500',
      description: 'Trải nghiệm đăng tin tuyển dụng hiệu quả với vị trí nổi bật trong Việc làm tốt nhất kết hợp cùng các dịch vụ cao cấp, giá dùng thử hấp dẫn.',
      isTrial: true
    },
    {
      id: 'top-pro-trial',
      title: 'TOP PRO TRIAL',
      price: '2,448,000',
      description: 'Trải nghiệm đăng tin tuyển dụng tối ưu với vị trí ưu tiên trong Việc làm hấp dẫn kết hợp cùng các dịch vụ cao cấp, giá dùng thử hấp dẫn.',
      isTrial: true
    },
    {
      id: 'top-eco-plus-trial',
      title: 'TOP ECO PLUS TRIAL',
      price: '2,112,000',
      description: 'Trải nghiệm đăng tin tuyển dụng tiết kiệm với vị trí hiển thị trong Đề xuất việc làm liên quan kết hợp cùng các dịch vụ khác, giá dùng thử hấp dẫn.',
      isTrial: true
    }
  ];

  regularPackages: ServicePackage[] = [
    {
      id: 'top-max-plus',
      title: 'TOP MAX PLUS',
      price: '9,650,000',
      description: 'Đăng tin tuyển dụng hiệu quả với vị trí nổi bật trong Việc làm tốt nhất, x2 lượt đấy Top, được sử dụng tỉnh năng CV để xuất kết hợp các dịch vụ cao cấp và được bảo hành với nhiều quyền lợi ưu tiên.',
      isVip: true
    },
    {
      id: 'top-max',
      title: 'TOP MAX',
      price: '7,500,000',
      description: 'Đăng tin tuyển dụng hiệu quả với vị trí nổi bật trong Việc làm tốt nhất, được sử dụng tính năng CV để xuất kết hợp các dịch vụ cao cấp và được bảo hành với nhiều quyền lợi ưu tiên.',
      isVip: true
    },
    {
      id: 'top-pro',
      title: 'TOP PRO',
      price: '5,440,000',
      description: 'Đăng tin tuyển dụng tối ưu với vị trí ưu tiên trong Việc làm hấp dẫn, được sử dụng tính năng CV đề xuất kết hợp các dịch vụ cao cấp và được bảo hành.',
      isVip: false
    },
    {
      id: 'top-eco-plus',
      title: 'TOP ECO PLUS',
      price: '4,400,000',
      description: 'Đăng tin tuyển dụng tiết kiệm với vị trí hiển thị trong Đề xuất việc làm liên quan, được sử dụng tính năng CV để xuất kết hợp các dịch vụ khác và được bảo hành.',
      isVip: false
    }
  ];

  constructor(
    private translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Check sidebar state periodically
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkSidebarState();
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar');
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onRequestQuote(): void {
    // TODO: Implement request quote functionality
    console.log('Request quote clicked');
  }

  onAddToCart(packageId: string): void {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', packageId);
  }

  onBuyNow(packageId: string): void {
    // TODO: Implement buy now functionality
    console.log('Buy now:', packageId);
  }
}

