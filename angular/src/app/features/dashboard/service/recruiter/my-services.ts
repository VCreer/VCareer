import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent, StatusDropdownComponent, StatusOption, PaginationComponent, GenericModalComponent, CvEmptyStateComponent } from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';
import { UserSubcriptionService } from 'src/app/proxy/services/subcription';
import { SubcriptionsViewDto } from 'src/app/proxy/dto/subcriptions';
import { SubcriptionContance_SubcriptionStatus } from 'src/app/proxy/constants/job-constant';
import { CurrentUserInfoDto } from 'src/app/proxy/dto/auth-dto';
import { AuthStateService } from 'src/app/core/services/auth-Cookiebased/auth-state.service';
export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  dayDuration?: number;
  status: SubcriptionContance_SubcriptionStatus;
  isActive: boolean;
  isLifeTime: boolean;
}

export type ServiceStatus = 'running' | 'ended' | 'expired';

@Component({
  selector: 'app-my-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent, StatusDropdownComponent, PaginationComponent, GenericModalComponent, CvEmptyStateComponent],
  templateUrl: './my-services.html',
  styleUrls: ['./my-services.scss']
})
export class MyServicesComponent implements OnInit, OnDestroy {
  private readonly componentId = 'my-services';
  
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;
  
  // Active tab
  activeTab: ServiceStatus = 'running';
  
  // Service list
  allServices: ServiceItem[] = [];
  filteredServices: ServiceItem[] = [];
  paginatedServices: ServiceItem[] = [];
  
  // Filters
  selectedServiceType: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Service type options
  serviceTypeOptions: StatusOption[] = [
    { value: 'all', label: 'Tất cả loại dịch vụ' }
  ];
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  // Cancel subscription modal
  showCancelModal = false;
  selectedServiceForCancellation: ServiceItem | null = null;
  
  // Actions menu
  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuServiceId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  // Loading state
  isLoading: boolean = false;

  // Current user
  private currentUser: CurrentUserInfoDto | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService,
    private cdr: ChangeDetectorRef,
    private userSubcriptionService: UserSubcriptionService,
    private authApi: AuthStateService
  ) {}

  ngOnInit(): void {
    // Setup sidebar sync
    this.sidebarSync.setupSync(
      '.my-services-page',
      '.breadcrumb-box',
      this.componentId
    );
    
    // Check sidebar state periodically
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
    
    // Get current user from auth service
    this.currentUser = this.authApi.user;
    
    // Check route for tab parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tab = params['tab'] as ServiceStatus;
        if (['running', 'ended', 'expired'].includes(tab)) {
          this.activeTab = tab;
        }
      }
      this.loadServices();
    });
  }

  ngOnDestroy(): void {
    this.sidebarSync.cleanup(this.componentId);
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    this.removeScrollListener();
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  loadServices(): void {
    // Check if user is available
    if (!this.currentUser || !this.currentUser.userId) {
      console.warn('User ID not available');
      return;
    }

    this.isLoading = true;
    const status = this.getStatusFromTab(this.activeTab);
    
    this.userSubcriptionService.getAllSubcriptionsByUserByUserIdAndStatusAndPagingDto(
      this.currentUser.userId,
      status,
      {
        pageIndex: this.currentPage -1,
        pageSize: this.itemsPerPage
      }
    ).subscribe({
      next: (services: SubcriptionsViewDto[]) => {
        console.log('Services loaded:', services);
        this.allServices = services.map(s => this.mapToServiceItem(s));
        
        // Reset filters when loading new tab data
        this.selectedServiceType = 'all';
        
        this.filterServices();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.showErrorToast('Không thể tải danh sách dịch vụ');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapToServiceItem(dto: SubcriptionsViewDto): ServiceItem {
    return {
      id: dto.id || '',
      title: dto.title || '',
      description: dto.description || '',
      originalPrice: dto.originalPrice,
      dayDuration: dto.dayDuration,
      status: dto.status!,
      isActive: dto.isActive,
      isLifeTime: dto.isLifeTime
    };
  }

  private getStatusFromTab(tab: ServiceStatus): number {
    const statusMap: Record<ServiceStatus, SubcriptionContance_SubcriptionStatus> = {
      'running': SubcriptionContance_SubcriptionStatus.Active,
      'ended': SubcriptionContance_SubcriptionStatus.Cancelled,
      'expired': SubcriptionContance_SubcriptionStatus.Expired
    };
    return statusMap[tab];
  }

  onTabChange(tab: ServiceStatus): void {
    this.activeTab = tab;
    this.currentPage = 1;
    // Reset filters when changing tabs
    this.selectedServiceType = 'all';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    this.loadServices();
    this.cdr.detectChanges();
  }

  onServiceTypeChange(value: string): void {
    this.selectedServiceType = value;
    this.currentPage = 1;
    this.filterServices();
  }

  filterServices(): void {
    this.filteredServices = this.allServices.filter(service => {
      // Filter by service type
      if (this.selectedServiceType !== 'all') {
        const titleLower = service.title.toLowerCase();
        return titleLower.includes(this.selectedServiceType.toLowerCase());
      }
      return true;
    });
    
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredServices.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getTabLabel(tab: ServiceStatus): string {
    const labels: Record<ServiceStatus, string> = {
      'running': 'Đang chạy',
      'ended': 'Đã kết thúc',
      'expired': 'Hết hạn'
    };
    return labels[tab];
  }

  getTabIcon(tab: ServiceStatus): string {
    const icons: Record<ServiceStatus, string> = {
      'running': 'fa-play-circle',
      'ended': 'fa-stopwatch',
      'expired': 'fa-calendar-times'
    };
    return `fa ${icons[tab]}`;
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onCancelSubscription(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Close menu
    this.closeActionsMenu();
    
    // Show cancel modal
    this.selectedServiceForCancellation = service;
    this.showCancelModal = true;
  }

  onCloseCancelModal(): void {
    this.showCancelModal = false;
    this.selectedServiceForCancellation = null;
  }

  onConfirmCancel(): void {
    if (this.selectedServiceForCancellation) {
      this.userSubcriptionService.cancleUserSubcriptionBySubcriptionServiceId(
        this.selectedServiceForCancellation.id
      ).subscribe({
        next: () => {
          this.showSuccessToast('Hủy dịch vụ thành công!');
          this.showCancelModal = false;
          this.selectedServiceForCancellation = null;
          // Reload services
          this.loadServices();
        },
        error: (error) => {
          console.error('Error canceling subscription:', error);
          this.showErrorToast('Không thể hủy dịch vụ. Vui lòng thử lại.');
        }
      });
    }
  }

  onViewCampaignReport(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Close menu
    this.showActionsMenu = null;
    
    // Navigate to recruitment report page
    this.router.navigate(['/recruiter/recruitment-report'], {
      queryParams: {
        serviceId: service.id
      }
    });
  }

  trackByServiceId(index: number, service: ServiceItem): string {
    return service.id;
  }

  toggleActionsMenu(serviceId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.showActionsMenu === serviceId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = serviceId;
      this.currentMenuServiceId = serviceId;
      if (event) {
        const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
        this.currentMenuButton = button || null;
      }
      setTimeout(() => {
        this.positionActionsMenu(serviceId, event);
        this.setupScrollListener(serviceId);
      }, 0);
    }
  }

  private closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuServiceId = null;
    this.currentMenuButton = null;
    this.removeScrollListener();
  }

  private setupScrollListener(serviceId: string): void {
    this.removeScrollListener();
    
    this.scrollListener = () => {
      if (this.showActionsMenu === serviceId && this.currentMenuServiceId === serviceId) {
        this.updateMenuPosition(serviceId);
      }
    };
    
    window.addEventListener('scroll', this.scrollListener, true);
    window.addEventListener('resize', this.scrollListener);
  }

  private getSidebarWidth(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return 0;
    
    const pageElement = document.querySelector('.my-services-page');
    if (pageElement && pageElement.classList.contains('sidebar-expanded')) {
      return 280;
    }
    return 72;
  }

  private updateMenuPosition(serviceId: string): void {
    const menu = document.querySelector(`.actions-menu[data-service-id="${serviceId}"]`) as HTMLElement;
    const button = this.currentMenuButton;
    
    if (!menu || !button) {
      if (!menu) {
        setTimeout(() => this.updateMenuPosition(serviceId), 10);
      }
      return;
    }
    
    const rect = button.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 280;
    const menuHeight = menu.offsetHeight || 100;
    const sidebarWidth = this.getSidebarWidth();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;
    
    let left = rect.left + rect.width / 2 - menuWidth / 2;
    let top = rect.bottom + 8;
    
    const minLeft = sidebarWidth + padding;
    if (left < minLeft) {
      left = minLeft;
    }
    
    const maxLeft = viewportWidth - menuWidth - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    
    if (top + menuHeight > viewportHeight - padding) {
      top = rect.top - menuHeight - 8;
    }
    
    if (top < padding) {
      top = padding;
    }
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      window.removeEventListener('resize', this.scrollListener);
      this.scrollListener = undefined;
    }
  }

  private positionActionsMenu(serviceId: string, event?: Event): void {
    if (!this.currentMenuButton && event) {
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;
    }
    
    if (!this.currentMenuButton) return;
    
    this.updateMenuPosition(serviceId);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
  }

  getDurationText(service: ServiceItem): string {
    if (service.isLifeTime) {
      return 'Vĩnh viễn';
    }
    if (service.dayDuration) {
      if (service.dayDuration < 7) {
        return `${service.dayDuration} ngày`;
      } else if (service.dayDuration % 7 === 0) {
        return `${service.dayDuration / 7} tuần`;
      } else {
        return `${service.dayDuration} ngày`;
      }
    }
    return '-';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
  }
}