import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent, StatusDropdownComponent, StatusOption, PaginationComponent, GenericModalComponent, CvEmptyStateComponent } from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';

export interface ServiceItem {
  id: string;
  orderId: string;
  serviceName: string;
  duration: string;
  serviceCode: string;
  purchaseDate: string;
  quantity: number;
  startDate: string;
  endDate: string;
  campaign: string;
  campaignJob?: string;
  isGift?: boolean;
  activationDate?: string; // Ngày kích hoạt dịch vụ (cho tab unused)
  expirationDate?: string; // Hạn kích hoạt (cho tab unused)
}

export type ServiceStatus = 'running' | 'scheduled' | 'unused' | 'pending' | 'ended' | 'expired';

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
  selectedOrderId: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Service type options
  serviceTypeOptions: StatusOption[] = [
    { value: 'all', label: 'Tất cả loại dịch vụ' },
    { value: 'top-max', label: 'TOP MAX' },
    { value: 'top-pro', label: 'TOP PRO' },
    { value: 'scout', label: 'Scout' },
    { value: 'ebp', label: 'Chuyên trang tuyển dụng - EBP' }
  ];
  
  // Order ID options (dynamically generated from services)
  orderIdOptions: StatusOption[] = [
    { value: '', label: 'Mã đơn hàng' }
  ];
  
  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  // Activate service modal
  showActivateModal = false;
  selectedServiceForActivation: ServiceItem | null = null;
  selectedQuantity: number = 1;
  
  // Cancel activation modal
  showCancelActivationModal = false;
  selectedServiceForCancellation: ServiceItem | null = null;
  
  // Actions menu
  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuServiceId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService,
    private cdr: ChangeDetectorRef
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
    
    // Check route for tab parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tab = params['tab'] as ServiceStatus;
        if (['running', 'scheduled', 'unused', 'pending', 'ended', 'expired'].includes(tab)) {
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
    // Mock data based on active tab
    this.allServices = this.getMockServices(this.activeTab);
    
    // Update order ID options from services
    this.updateOrderIdOptions();
    
    // Reset filters when loading new tab data
    this.selectedServiceType = 'all';
    this.selectedOrderId = '';
    
    this.filterServices();
    this.cdr.detectChanges();
  }

  updateOrderIdOptions(): void {
    // Get unique order IDs from services
    const uniqueOrderIds = [...new Set(this.allServices.map(s => s.orderId))].sort();
    
    // Update order ID options
    this.orderIdOptions = [
      { value: '', label: 'Mã đơn hàng' },
      ...uniqueOrderIds.map(id => ({ value: id, label: `#${id}` }))
    ];
  }

  getMockServices(status: ServiceStatus): ServiceItem[] {
    const baseServices: ServiceItem[] = [
      {
        id: '1',
        orderId: '23827',
        serviceName: 'TOP MAX',
        duration: '2 tuần',
        serviceCode: '49964',
        purchaseDate: '21/09/2022',
        quantity: 1,
        startDate: '21/09/2022',
        endDate: '05/10/2022',
        campaign: 'Chiến dịch test Tim CV',
        campaignJob: 'Tuyển Dụng Tester'
      },
      {
        id: '2',
        orderId: '23750',
        serviceName: 'Scout Standard',
        duration: '4 tuần',
        serviceCode: '49854',
        purchaseDate: '17/03/2022',
        quantity: 1,
        startDate: '12/09/2022',
        endDate: '10/10/2022',
        campaign: 'ahihisadsadsa',
        campaignJob: '<H1 Onclick=Alert(1)>test</H1>'
      },
      {
        id: '3',
        orderId: '23751',
        serviceName: 'Chuyên trang tuyển dụng - EBP',
        duration: '53 tuần',
        serviceCode: '49630',
        purchaseDate: '20/03/2022',
        quantity: 1,
        startDate: '20/03/2022',
        endDate: '26/03/2023',
        campaign: '-'
      },
      {
        id: '4',
        orderId: '23731',
        serviceName: 'Chuyên trang tuyển dụng - EBP',
        duration: '53 tuần',
        serviceCode: '49558',
        purchaseDate: '21/01/2022',
        quantity: 1,
        startDate: '16/02/2022',
        endDate: '22/02/2023',
        campaign: '-',
        isGift: true
      }
    ];

    // Filter by status (mock logic)
    if (status === 'running') {
      return baseServices.filter(s => {
        const endDate = new Date(s.endDate.split('/').reverse().join('-'));
        const today = new Date();
        return endDate >= today;
      });
    } else if (status === 'ended') {
      return baseServices.filter(s => {
        const endDate = new Date(s.endDate.split('/').reverse().join('-'));
        const today = new Date();
        return endDate < today;
      });
    } else if (status === 'unused') {
      // Mock data cho tab unused với activationDate và expirationDate
      return [
        {
          id: '5',
          orderId: '23830',
          serviceName: 'TOP MAX',
          duration: '2 tuần',
          serviceCode: '49965',
          purchaseDate: '15/10/2024',
          quantity: 1,
          startDate: '',
          endDate: '',
          campaign: '-',
          activationDate: '-',
          expirationDate: '15/12/2024'
        },
        {
          id: '6',
          orderId: '23831',
          serviceName: 'TOP PRO',
          duration: '4 tuần',
          serviceCode: '49966',
          purchaseDate: '20/10/2024',
          quantity: 2,
          startDate: '',
          endDate: '',
          campaign: '-',
          activationDate: '-',
          expirationDate: '20/12/2024'
        },
        {
          id: '7',
          orderId: '23832',
          serviceName: 'Scout Standard',
          duration: '1 tuần',
          serviceCode: '49967',
          purchaseDate: '25/10/2024',
          quantity: 1,
          startDate: '',
          endDate: '',
          campaign: '-',
          activationDate: '-',
          expirationDate: '25/11/2024',
          isGift: true
        }
      ];
    } else if (status === 'pending') {
      // Mock data cho tab pending
      return [
        {
          id: '8',
          orderId: '23833',
          serviceName: 'TOP MAX',
          duration: '2 tuần',
          serviceCode: '49968',
          purchaseDate: '01/11/2024',
          quantity: 1,
          startDate: '05/11/2024',
          endDate: '19/11/2024',
          campaign: 'Chiến dịch tuyển dụng nhân viên',
          campaignJob: 'Tuyển dụng nhân viên bán hàng'
        },
        {
          id: '9',
          orderId: '23834',
          serviceName: 'TOP PRO',
          duration: '4 tuần',
          serviceCode: '49969',
          purchaseDate: '02/11/2024',
          quantity: 2,
          startDate: '10/11/2024',
          endDate: '08/12/2024',
          campaign: 'Tuyển dụng kế toán',
          campaignJob: 'Tuyển dụng kế toán viên'
        }
      ];
    } else if (status === 'expired') {
      // Mock data cho tab expired với activationDate và expirationDate (đã hết hạn)
      return [
        {
          id: '10',
          orderId: '23835',
          serviceName: 'TOP MAX',
          duration: '2 tuần',
          serviceCode: '49970',
          purchaseDate: '01/09/2024',
          quantity: 1,
          startDate: '',
          endDate: '',
          campaign: '-',
          activationDate: '-',
          expirationDate: '15/09/2024'
        },
        {
          id: '11',
          orderId: '23836',
          serviceName: 'TOP PRO',
          duration: '4 tuần',
          serviceCode: '49971',
          purchaseDate: '10/08/2024',
          quantity: 2,
          startDate: '',
          endDate: '',
          campaign: '-',
          activationDate: '-',
          expirationDate: '10/09/2024'
        },
        {
          id: '12',
          orderId: '23837',
          serviceName: 'Scout Standard',
          duration: '1 tuần',
          serviceCode: '49972',
          purchaseDate: '20/08/2024',
          quantity: 1,
          startDate: '',
          endDate: '',
          campaign: '-',
          activationDate: '-',
          expirationDate: '27/08/2024',
          isGift: true
        }
      ];
    }
    
    return baseServices;
  }

  onTabChange(tab: ServiceStatus): void {
    this.activeTab = tab;
    this.currentPage = 1;
    // Reset filters when changing tabs
    this.selectedServiceType = 'all';
    this.selectedOrderId = '';
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

  onOrderIdChange(value: string): void {
    this.selectedOrderId = value;
    this.currentPage = 1;
    this.filterServices();
  }


  filterServices(): void {
    this.filteredServices = this.allServices.filter(service => {
      // Filter by service type
      let matchesServiceType = true;
      if (this.selectedServiceType !== 'all') {
        const serviceNameLower = service.serviceName.toLowerCase();
        if (this.selectedServiceType === 'top-max') {
          matchesServiceType = serviceNameLower.includes('top max');
        } else if (this.selectedServiceType === 'top-pro') {
          matchesServiceType = serviceNameLower.includes('top pro');
        } else if (this.selectedServiceType === 'scout') {
          matchesServiceType = serviceNameLower.includes('scout');
        } else if (this.selectedServiceType === 'ebp') {
          matchesServiceType = serviceNameLower.includes('ebp') || serviceNameLower.includes('chuyên trang');
        } else {
          matchesServiceType = serviceNameLower.includes(this.selectedServiceType.toLowerCase());
        }
      }
      
      // Filter by order ID
      const matchesOrderId = !this.selectedOrderId || service.orderId === this.selectedOrderId;
      
      return matchesServiceType && matchesOrderId;
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

  onOrderIdClick(orderId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Filter by order ID
    this.selectedOrderId = orderId;
    this.filterServices();
    this.currentPage = 1;
    this.updatePagination();
  }

  getTabLabel(tab: ServiceStatus): string {
    const labels: Record<ServiceStatus, string> = {
      'running': 'Đang chạy',
      'scheduled': 'Đã lên lịch',
      'unused': 'Chưa sử dụng',
      'pending': 'Chờ kích hoạt',
      'ended': 'Đã kết thúc',
      'expired': 'Đã hết hạn'
    };
    return labels[tab];
  }

  getTabIcon(tab: ServiceStatus): string {
    const icons: Record<ServiceStatus, string> = {
      'running': 'fa-play-circle',
      'scheduled': 'fa-calendar',
      'unused': 'fa-link',
      'pending': 'fa-clock',
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

  onToastClose(): void {
    this.showToast = false;
  }

  onActivateService(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedServiceForActivation = service;
    this.selectedQuantity = service.quantity || 1;
    this.showActivateModal = true;
  }

  onCloseActivateModal(): void {
    this.showActivateModal = false;
    this.selectedServiceForActivation = null;
    this.selectedQuantity = 1;
  }

  onConfirmActivate(): void {
    if (this.selectedServiceForActivation && this.selectedQuantity > 0) {
      // TODO: Call API to activate service with selectedQuantity
      this.showSuccessToast('Yêu cầu kích hoạt dịch vụ đã được gửi thành công!');
      this.showActivateModal = false;
      this.selectedServiceForActivation = null;
      this.selectedQuantity = 1;
      // Reload services
      this.loadServices();
    }
  }

  onCancelActivation(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Close menu
    this.closeActionsMenu();
    
    // Show cancel activation modal
    this.selectedServiceForCancellation = service;
    this.showCancelActivationModal = true;
  }

  onCloseCancelActivationModal(): void {
    this.showCancelActivationModal = false;
    this.selectedServiceForCancellation = null;
  }

  onConfirmCancelActivation(): void {
    if (this.selectedServiceForCancellation) {
      // TODO: Call API to cancel activation
      this.showSuccessToast('Hủy kích hoạt dịch vụ thành công!');
      this.showCancelActivationModal = false;
      this.selectedServiceForCancellation = null;
      // Reload services
      this.loadServices();
    }
  }

  onViewCampaignReport(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Close menu
    this.showActionsMenu = null;
    
    // Navigate to recruitment report page
    if (service.campaign && service.campaign !== '-') {
      this.router.navigate(['/recruiter/recruitment-report'], {
        queryParams: {
          campaign: service.campaign
        }
      });
    } else {
      this.router.navigate(['/recruiter/recruitment-report']);
    }
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
      this.closeActionsMenu(); // Close any existing menu first
      this.showActionsMenu = serviceId;
      this.currentMenuServiceId = serviceId;
      // Store button reference
      if (event) {
        const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
        this.currentMenuButton = button || null;
      }
      // Position menu using fixed positioning
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
      // Retry after a short delay if menu not found
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
    
    // Calculate available width (viewport - sidebar - padding)
    const availableWidth = viewportWidth - sidebarWidth - (padding * 2);
    
    // Center menu below button
    let left = rect.left + rect.width / 2 - menuWidth / 2;
    let top = rect.bottom + 8;
    
    // Ensure menu doesn't go off left edge (consider sidebar)
    const minLeft = sidebarWidth + padding;
    if (left < minLeft) {
      left = minLeft;
    }
    
    // Ensure menu doesn't go off right edge
    const maxLeft = viewportWidth - menuWidth - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    
    // Ensure menu doesn't go off bottom
    if (top + menuHeight > viewportHeight - padding) {
      top = rect.top - menuHeight - 8;
    }
    
    // Ensure menu doesn't go off top
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
    // Use stored button reference if available, otherwise try to find from event
    if (!this.currentMenuButton && event) {
      const button = (event.target as HTMLElement).closest('.actions-menu-btn') as HTMLElement;
      this.currentMenuButton = button || null;
    }
    
    if (!this.currentMenuButton) return;
    
    this.updateMenuPosition(serviceId);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
  }

}

