import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TranslationService } from '../../../../core/services/translation.service';
import { CartService } from '../../../../core/services/cart.service';
import { SubcriptionService_Service } from 'src/app/proxy/services/subcription';
import { SubcriptionPriceService } from 'src/app/proxy/services/subcription';
import { 
  ChildServiceViewDto, 
  SubcriptionsViewDto 
} from 'src/app/proxy/dto/subcriptions/models';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

interface GroupedChildServices {
  actionLabel: string;
  services: ChildServiceViewDto[];
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
  serviceDetail: SubcriptionsViewDto | null = null;
  currentPrice: number = 0;
  childServices: ChildServiceViewDto[] = [];
  groupedChildServices: GroupedChildServices[] = [];
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
  
  isLoading = false;
  isLoadingChildServices = false;
  isLoadingPrice = false;
  
  private sidebarCheckInterval?: any;
  private routerSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translationService: TranslationService,
    private cartService: CartService,
    private subcriptionServiceProxy: SubcriptionService_Service,
    private priceService: SubcriptionPriceService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Get service ID from route
    this.route.params.subscribe(params => {
      this.serviceId = params['id'] || '';
      if (this.serviceId) {
        this.loadServiceDetail();
        this.loadCurrentPrice();
        this.loadChildServices();
      } else {
        this.router.navigate(['/recruiter/buy-services']);
      }
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
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadServiceDetail(): void {
    this.isLoading = true;
    
    this.subcriptionServiceProxy.getSubcriptionServiceBySubcriptionId(this.serviceId)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (service) => {
          this.serviceDetail = service;
        },
        error: (error) => {
          console.error('Error loading service detail:', error);
          this.showToastMessage('error', 'Không thể tải thông tin dịch vụ');
          this.router.navigate(['/recruiter/buy-services']);
        }
      });
  }

  loadCurrentPrice(): void {
    this.isLoadingPrice = true;
    
    this.priceService.getCurrentPriceOfSubcriptionBySubcriptionId(this.serviceId)
      .pipe(finalize(() => {
        this.isLoadingPrice = false;
      }))
      .subscribe({
        next: (price) => {
          this.currentPrice = price;
        },
        error: (error) => {
          console.error('Error loading current price:', error);
          // Fallback to originalPrice if current price not available
          if (this.serviceDetail) {
            this.currentPrice = this.serviceDetail.originalPrice;
          }
        }
      });
  }

  loadChildServices(): void {
    if (!this.serviceId) return;

    this.isLoadingChildServices = true;
    
    this.subcriptionServiceProxy.getChildServicesBySubcriptionIdAndIsActive(
      this.serviceId,
      true
    )
      .pipe(finalize(() => {
        this.isLoadingChildServices = false;
      }))
      .subscribe({
        next: (services) => {
          this.childServices = services;
          this.groupServicesByAction();
        },
        error: (error) => {
          console.error('Error loading child services:', error);
          this.childServices = [];
          this.groupedChildServices = [];
        }
      });
  }

  groupServicesByAction(): void {
    // Group child services by their action type
    const grouped = new Map<number, ChildServiceViewDto[]>();

    this.childServices.forEach(service => {
      if (service.action !== undefined) {
        if (!grouped.has(service.action)) {
          grouped.set(service.action, []);
        }
        grouped.get(service.action)!.push(service);
      }
    });

    // Convert to array with labels
    this.groupedChildServices = Array.from(grouped.entries()).map(([action, services]) => ({
      actionLabel: this.getServiceActionLabel(action),
      services
    }));
  }

  getServiceActionLabel(action: number): string {
    const labels: { [key: number]: string } = {
      0: 'Tăng điểm tin tuyển dụng',
      1: 'Đẩy tin lên đầu',
      2: 'Huy hiệu tin tuyển dụng',
      3: 'Giao diện công ty'
    };
    return labels[action] || 'Dịch vụ khác';
  }

  getValidityPeriod(): string {
    if (!this.serviceDetail) return '-';
    
    if (this.serviceDetail.isLifeTime) {
      return 'Vĩnh viễn';
    }
    if (this.serviceDetail.dayDuration) {
      if (this.serviceDetail.dayDuration === 7) return '1 tuần';
      if (this.serviceDetail.dayDuration === 30) return '1 tháng';
      if (this.serviceDetail.dayDuration === 365) return '1 năm';
      return `${this.serviceDetail.dayDuration} ngày`;
    }
    return '-';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
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
    if (!this.serviceDetail) return;

    this.cartService.addToCart({
      id: this.serviceDetail.id!,
      subscriptionServiceId: this.serviceDetail.id!
    }).subscribe({
      next: () => {
        this.showToastMessage('success', `Đã thêm "${this.serviceDetail!.title}" vào giỏ hàng`);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        const errorMessage = error?.error?.error?.message || 
                           error?.message || 
                           'Không thể thêm vào giỏ hàng. Vui lòng thử lại.';
        this.showToastMessage('error', errorMessage);
      }
    });
  }

  onBuyNow(): void {
    if (!this.serviceDetail) return;

    // Check if item already exists in cart
    const cartItems = this.cartService.getCartItems();
    const existingItem = cartItems.find(item => 
      item.subscriptionServiceId === this.serviceDetail!.id
    );

    if (existingItem) {
      // Item already exists, just navigate to cart
      this.router.navigate(['/recruiter/cart']);
    } else {
      // Item doesn't exist, add to cart first
      this.cartService.addToCart({
        id: this.serviceDetail.id!,
        subscriptionServiceId: this.serviceDetail.id!
      }).subscribe({
        next: () => {
          this.router.navigate(['/recruiter/cart']);
        },
        error: (error) => {
          console.error('Error adding to cart:', error);
          const errorMessage = error?.error?.error?.message || 
                             error?.message || 
                             'Không thể thêm vào giỏ hàng. Vui lòng thử lại.';
          this.showToastMessage('error', errorMessage);
        }
      });
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
}