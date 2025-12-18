import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, finalize } from 'rxjs/operators';
import { Subscription, forkJoin } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';
import { CartService } from '../../../../core/services/cart.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { SubcriptionService_Service } from 'src/app/proxy/services/subcription';
import { SubcriptionPriceService } from 'src/app/proxy/services/subcription';
import { SubcriptionsViewDto } from 'src/app/proxy/dto/subcriptions/models';

interface ServicePackageWithPrice extends SubcriptionsViewDto {
  currentPrice: number;
  formattedPrice: string;
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

  trialPackages: ServicePackageWithPrice[] = [];
  regularPackages: ServicePackageWithPrice[] = [];
  // Phân trang cho TOP JOBS
  regularCurrentPage: number = 1;
  readonly regularPageSize: number = 3;

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private cartService: CartService,
    private subcriptionServiceProxy: SubcriptionService_Service,
    private priceService: SubcriptionPriceService
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
    
    // Target = 1 for Recruiter (based on SubcriptionContance_SubcriptorTarget enum)
    this.subcriptionServiceProxy.getActiveSubscriptionServices('1')
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (services) => {
          this.processSubscriptionServices(services);
        },
        error: (error) => {
          console.error('Error loading subscription services:', error);
          this.showToastMessage('error', 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
        }
      });
  }

  processSubscriptionServices(services: SubcriptionsViewDto[]): void {
    if (!services || services.length === 0) {
      this.trialPackages = [];
      this.regularPackages = [];
      this.regularCurrentPage = 1;
      return;
    }

    // Load prices for all services
    const priceRequests = services.map(service => 
      this.priceService.getCurrentPriceOfSubcriptionBySubcriptionId(service.id!)
    );

    forkJoin(priceRequests).subscribe({
      next: (prices) => {
        this.trialPackages = [];
        this.regularPackages = [];

        services.forEach((service, index) => {
          const currentPrice = prices[index];
          
          const packageItem: ServicePackageWithPrice = {
            ...service,
            currentPrice: currentPrice,
            formattedPrice: this.formatPrice(currentPrice),
            isTrial: service.title?.toLowerCase().includes('trial') || false,
            isVip: service.title?.toLowerCase().includes('max') || 
                   service.title?.toLowerCase().includes('plus') || false
          };

          if (packageItem.isTrial) {
            this.trialPackages.push(packageItem);
          } else {
            this.regularPackages.push(packageItem);
          }
        });

        // Reset về trang đầu sau khi load dữ liệu
        this.regularCurrentPage = 1;
      },
      error: (error) => {
        console.error('Error loading prices:', error);
        // Fallback: use original prices if current prices fail to load
        this.trialPackages = [];
        this.regularPackages = [];

        services.forEach(service => {
          const packageItem: ServicePackageWithPrice = {
            ...service,
            currentPrice: service.originalPrice,
            formattedPrice: this.formatPrice(service.originalPrice),
            isTrial: service.title?.toLowerCase().includes('trial') || false,
            isVip: service.title?.toLowerCase().includes('max') || 
                   service.title?.toLowerCase().includes('plus') || false
          };

          if (packageItem.isTrial) {
            this.trialPackages.push(packageItem);
          } else {
            this.regularPackages.push(packageItem);
          }
        });

        // Reset về trang đầu sau khi load dữ liệu (fallback)
        this.regularCurrentPage = 1;
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  getDiscountPercent(originalPrice: number, currentPrice: number): string {
    if (originalPrice <= 0 || currentPrice >= originalPrice) return '0';
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return discount.toFixed(0);
  }

  // ====== Helpers cho phân trang TOP JOBS ======
  get regularTotalPages(): number {
    if (!this.regularPackages || this.regularPackages.length === 0) return 1;
    return Math.ceil(this.regularPackages.length / this.regularPageSize);
  }

  get pagedRegularPackages(): ServicePackageWithPrice[] {
    if (!this.regularPackages || this.regularPackages.length === 0) return [];
    const startIndex = (this.regularCurrentPage - 1) * this.regularPageSize;
    const endIndex = startIndex + this.regularPageSize;
    return this.regularPackages.slice(startIndex, endIndex);
  }

  goToRegularPage(page: number): void {
    if (page < 1 || page > this.regularTotalPages) return;
    this.regularCurrentPage = page;
  }

  goToPreviousRegularPage(): void {
    if (this.regularCurrentPage > 1) {
      this.regularCurrentPage--;
    }
  }

  goToNextRegularPage(): void {
    if (this.regularCurrentPage < this.regularTotalPages) {
      this.regularCurrentPage++;
    }
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
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onRequestQuote(): void {
    this.router.navigate(['/recruiter/service-quotation']);
  }

  onViewDetail(packageId: string): void {
    this.router.navigate(['/recruiter/buy-services/detail', packageId]);
  }

  onAddToCart(packageId: string): void {
    const allPackages = [...this.trialPackages, ...this.regularPackages];
    const selectedPackage = allPackages.find(pkg => pkg.id === packageId);
    
    if (selectedPackage) {
      this.cartService.addToCart({
        id: selectedPackage.id!,
        subscriptionServiceId: selectedPackage.id!
      }).subscribe({
        next: () => {
          this.showToastMessage('success', `Đã thêm "${selectedPackage.title}" vào giỏ hàng`);
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

  onBuyNow(packageId: string): void {
    const allPackages = [...this.trialPackages, ...this.regularPackages];
    const selectedPackage = allPackages.find(pkg => pkg.id === packageId);
    
    if (selectedPackage) {
      // Check if item already exists in cart
      const cartItems = this.cartService.getCartItems();
      const existingItem = cartItems.find(item => item.subscriptionServiceId === packageId);
      
      if (existingItem) {
        // Item already exists, just navigate to cart without adding
        this.router.navigate(['/recruiter/cart']);
      } else {
        // Item doesn't exist, add to cart first
        this.cartService.addToCart({
          id: selectedPackage.id!,
          subscriptionServiceId: selectedPackage.id!
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
  }
}