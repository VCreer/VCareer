import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';
import { CartService } from '../../../../core/services/cart.service';
import { SubscriptionService, SubscriptionServiceDto } from '../../../../core/services/subscription.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

interface ServicePackage {
  id: string;
  title: string;
  price: string;
  originalPrice: number;
  description: string;
  isVip?: boolean;
  isTrial?: boolean;
}

@Component({
  selector: 'app-buy-services',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './buy-services.html',
  styleUrls: ['./buy-services.scss']
})
export class BuyServicesComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  sidebarExpanded: boolean = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
  isLoading = false;
  private routerSubscription?: Subscription;
  private sidebarCheckInterval?: any;

  trialPackages: ServicePackage[] = [];
  regularPackages: ServicePackage[] = [];

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private cartService: CartService,
    private subscriptionService: SubscriptionService
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

    // Load subscription services
    this.loadSubscriptionServices();
  }

  loadSubscriptionServices(): void {
    this.isLoading = true;
    this.subscriptionService.getActiveSubscriptionServices(1) // 1 = Recruiter
      .subscribe({
        next: (services) => {
          this.processSubscriptionServices(services);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading subscription services:', error);
          this.showToastMessage('error', 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
          this.isLoading = false;
        }
      });
  }

  processSubscriptionServices(services: SubscriptionServiceDto[]): void {
    this.trialPackages = [];
    this.regularPackages = [];

    services.forEach(service => {
      const packageItem: ServicePackage = {
        id: service.id,
        title: service.title,
        price: this.formatPrice(service.originalPrice),
        originalPrice: service.originalPrice,
        description: service.description,
        isTrial: service.title.toLowerCase().includes('trial'),
        isVip: service.title.toLowerCase().includes('max') || service.title.toLowerCase().includes('plus')
      };

      if (packageItem.isTrial) {
        this.trialPackages.push(packageItem);
      } else {
        this.regularPackages.push(packageItem);
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
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

  onRequestQuote(): void {
    // TODO: Implement request quote functionality
  }

  onViewDetail(packageId: string): void {
    this.router.navigate(['/recruiter/buy-services/detail', packageId]);
  }

  onAddToCart(packageId: string): void {
    const allPackages = [...this.trialPackages, ...this.regularPackages];
    const selectedPackage = allPackages.find(pkg => pkg.id === packageId);
    
    if (selectedPackage) {
      const added = this.cartService.addToCart({
        id: selectedPackage.id,
        title: selectedPackage.title,
        price: selectedPackage.price,
        originalPrice: selectedPackage.originalPrice
      });

      if (added) {
        this.showToastMessage('success', `Đã thêm "${selectedPackage.title}" vào giỏ hàng`);
      }
    }
  }

  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onBuyNow(packageId: string): void {
    const allPackages = [...this.trialPackages, ...this.regularPackages];
    const selectedPackage = allPackages.find(pkg => pkg.id === packageId);
    
    if (selectedPackage) {
      const added = this.cartService.addToCart({
        id: selectedPackage.id,
        title: selectedPackage.title,
        price: selectedPackage.price,
        originalPrice: selectedPackage.originalPrice
      });

      if (added) {
        this.router.navigate(['/recruiter/cart']);
      }
    }
  }
}