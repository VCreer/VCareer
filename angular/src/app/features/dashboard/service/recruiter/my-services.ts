import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent, StatusDropdownComponent, StatusOption, PaginationComponent, GenericModalComponent, CvEmptyStateComponent } from '../../../../shared/components';
import { SidebarSyncService } from '../../../../core/services/sidebar-sync.service';
import { UserSubcriptionService, SubcriptionService_Service, User_ChildService_Service } from 'src/app/proxy/services/subcription';
import { OptionsChildServiceViewDto, User_ChildServiceViewDto, ChildServiceViewDto, User_SubcirptionViewDto, SubcriptionsViewDto } from 'src/app/proxy/dto/subcriptions';
import { SubcriptionContance_SubcriptionStatus, SubcriptionContance_ChildServiceStatus, SubcriptionContance_ServiceAction, SubcriptionContance_ServiceTarget } from 'src/app/proxy/constants/job-constant';
import { CurrentUserInfoDto } from 'src/app/proxy/dto/auth-dto';
import { AuthStateService } from 'src/app/core/services/auth-Cookiebased/auth-state.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  dayDuration?: number;
  isActive: boolean;
  isLifeTime: boolean;
  userSubscription?: User_SubcirptionViewDto;
  childServices?: ChildServiceInfo[];
}

export interface ChildServiceInfo {
  childService: ChildServiceViewDto;
  userChildService: User_ChildServiceViewDto;
}

export interface UsageHistoryItem {
  userChildService: User_ChildServiceViewDto;
  childServiceDetail?: ChildServiceViewDto;
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
  
  activeTab: ServiceStatus = 'running';
  
  allServices: ServiceItem[] = [];
  filteredServices: ServiceItem[] = [];
  paginatedServices: ServiceItem[] = [];
  
  selectedServiceType: string = 'all';
  
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  serviceTypeOptions: StatusOption[] = [
    { value: 'all', label: 'Tất cả loại dịch vụ' },
    { value: 'boost', label: 'Tăng điểm Job' },
    { value: 'top', label: 'Top danh sách' },
    { value: 'badge', label: 'Badge công việc' },
    { value: 'theme', label: 'Giao diện công ty' }
  ];
  
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  showCancelModal = false;
  selectedServiceForCancellation: ServiceItem | null = null;
  
  showDetailsModal = false;
  selectedServiceForDetails: ServiceItem | null = null;
  detailedChildServices: ChildServiceViewDto[] = [];
  isLoadingDetails: boolean = false;
  
  showUsageHistoryModal = false;
  selectedServiceForUsageHistory: ServiceItem | null = null;
  usageHistoryData: UsageHistoryItem[] = [];
  isLoadingUsageHistory: boolean = false;
  
  showToggleShareModal = false;
  selectedServiceForShare: ServiceItem | null = null;
  
  showActionsMenu: string | null = null;
  private scrollListener?: () => void;
  private currentMenuServiceId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;

  isLoading: boolean = false;

  private currentUser: CurrentUserInfoDto | null = null;

  SubcriptionStatus = SubcriptionContance_SubcriptionStatus;
  ChildServiceStatus = SubcriptionContance_ChildServiceStatus;
  ServiceAction = SubcriptionContance_ServiceAction;
  ServiceTarget = SubcriptionContance_ServiceTarget;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sidebarSync: SidebarSyncService,
    private cdr: ChangeDetectorRef,
    private userSubcriptionService: UserSubcriptionService,
    private subcriptionService: SubcriptionService_Service,
    private userChildServiceService: User_ChildService_Service,
    private authApi: AuthStateService
  ) {}

  ngOnInit(): void {
    this.sidebarSync.setupSync(
      '.my-services-page',
      '.breadcrumb-box',
      this.componentId
    );
    
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
    
    this.currentUser = this.authApi.user;
    
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
    if (!this.currentUser || !this.currentUser.userId) {
      console.warn('User ID not available');
      return;
    }

    this.isLoading = true;
    const status = this.getStatusFromTab(this.activeTab);
    
    const actions = [
      SubcriptionContance_ServiceAction.BoostScoreJob,
      SubcriptionContance_ServiceAction.TopList,
      SubcriptionContance_ServiceAction.JobBadge,
      SubcriptionContance_ServiceAction.ThemeCompany,
    ];

    const requests = actions.map(action => 
      this.userSubcriptionService.getAllSubcriptionsByUserByUserIdAndStatusAndPagingDtoAndServiceAction(
        this.currentUser!.userId,
        status,
        {
          pageIndex: 0,
          pageSize: 1000
        },
        action
      ).pipe(
        catchError(error => {
          console.error(`Error loading services for action ${action}:`, error);
          return of([]);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results: OptionsChildServiceViewDto[][]) => {
        console.log('Services loaded from all actions:', results);
        
        const allOptions = results.reduce((acc, curr) => acc.concat(curr), []);
        
        const subscriptionMap = new Map<string, OptionsChildServiceViewDto[]>();
        
        allOptions.forEach(opt => {
          const subId = opt.user_subcription?.id;
          if (subId) {
            if (!subscriptionMap.has(subId)) {
              subscriptionMap.set(subId, []);
            }
            subscriptionMap.get(subId)!.push(opt);
          }
        });
        
        this.allServices = Array.from(subscriptionMap.entries()).map(([subId, options]) => 
          this.mapToServiceItem(options)
        );
        
        console.log('Mapped services:', this.allServices);
        
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

  private mapToServiceItem(options: OptionsChildServiceViewDto[]): ServiceItem {
    if (options.length === 0) {
      throw new Error('Empty options array');
    }
    
    const userSubscription = options[0].user_subcription!;
    const subscriptionDto = options[0].subcriptionsViewDto!;
    
    const childServices: ChildServiceInfo[] = [];
    
    options.forEach(opt => {
      if (opt.childService && opt.user_ChildServices) {
        childServices.push({
          childService: opt.childService,
          userChildService: opt.user_ChildServices
        });
      }
    });
    
    const isLifeTime = childServices.some(cs => cs.childService.isLifeTime) || subscriptionDto.isLifeTime;
    const dayDuration = subscriptionDto.dayDuration;
    
    return {
      id: userSubscription.id || '',
      title: subscriptionDto.title || 'Gói dịch vụ',
      description: subscriptionDto.description || '',
      originalPrice: subscriptionDto.originalPrice || 0,
      dayDuration: dayDuration,
      isActive: userSubscription.status === SubcriptionContance_SubcriptionStatus.Active,
      isLifeTime: isLifeTime,
      userSubscription: userSubscription,
      childServices: childServices
    };
  }

  private getStatusFromTab(tab: ServiceStatus): SubcriptionContance_SubcriptionStatus {
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
      if (this.selectedServiceType !== 'all') {
        const hasMatchingType = service.childServices?.some(cs => {
          const action = cs.childService.action;
          switch (this.selectedServiceType) {
            case 'boost':
              return action === SubcriptionContance_ServiceAction.BoostScoreJob;
            case 'top':
              return action === SubcriptionContance_ServiceAction.TopList;
            case 'badge':
              return action === SubcriptionContance_ServiceAction.JobBadge;
            case 'theme':
              return action === SubcriptionContance_ServiceAction.ThemeCompany;
            default:
              return false;
          }
        });
        
        if (!hasMatchingType) {
          return false;
        }
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

  onViewDetails(service: ServiceItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.closeActionsMenu();
    
    this.selectedServiceForDetails = service;
    this.showDetailsModal = true;
    
    this.loadServiceDetails(service);
  }

  private loadServiceDetails(service: ServiceItem): void {
    if (!service.userSubscription?.subcriptionServiceId) {
      console.warn('No subscription service ID available');
      return;
    }

    this.isLoadingDetails = true;
    this.detailedChildServices = [];
    
    this.subcriptionService.getChildServicesBySubcriptionIdAndIsActive(
      service.userSubscription.subcriptionServiceId,
      true
    ).subscribe({
      next: (childServices: ChildServiceViewDto[]) => {
        console.log('Child services loaded:', childServices);
        this.detailedChildServices = childServices;
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading child services:', error);
        this.showErrorToast('Không thể tải chi tiết dịch vụ');
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCloseDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedServiceForDetails = null;
    this.detailedChildServices = [];
    this.isLoadingDetails = false;
  }

  onViewUsageHistory(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.closeActionsMenu();
    
    this.selectedServiceForUsageHistory = service;
    this.showUsageHistoryModal = true;
    
    this.loadUsageHistory(service);
  }

  private loadUsageHistory(service: ServiceItem): void {
    if (!service.userSubscription?.id) {
      console.warn('No subscription ID available');
      return;
    }

    if (!service.userSubscription?.subcriptionServiceId) {
      console.warn('No subscription service ID available');
      return;
    }

    this.isLoadingUsageHistory = true;
    this.usageHistoryData = [];
    
    // Load User_ChildService list và ChildService details
    forkJoin({
      userChildServices: this.userChildServiceService.getUserChildServiceByUserSubcriptionId(
        service.userSubscription.id
      ),
      childServiceDetails: this.subcriptionService.getChildServicesBySubcriptionIdAndIsActive(
        service.userSubscription.subcriptionServiceId,
        true
      )
    }).subscribe({
      next: ({ userChildServices, childServiceDetails }) => {
        console.log('User child services loaded:', userChildServices);
        console.log('Child service details loaded:', childServiceDetails);
        
        // Map userChildServices với childServiceDetails
        this.usageHistoryData = userChildServices.map(ucs => {
          const childDetail = childServiceDetails.find(
            cs => cs.id === ucs.childServiceId
          );
          
          return {
            userChildService: ucs,
            childServiceDetail: childDetail
          };
        });
        
        console.log('Usage history mapped:', this.usageHistoryData);
        console.log('Total usage history items:', this.usageHistoryData.length);
        
        this.isLoadingUsageHistory = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading usage history:', error);
        this.showErrorToast('Không thể tải lịch sử sử dụng');
        this.isLoadingUsageHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCloseUsageHistoryModal(): void {
    this.showUsageHistoryModal = false;
    this.selectedServiceForUsageHistory = null;
    this.usageHistoryData = [];
    this.isLoadingUsageHistory = false;
  }

  onToggleShare(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.closeActionsMenu();
    
    this.selectedServiceForShare = service;
    this.showToggleShareModal = true;
  }

  onCloseToggleShareModal(): void {
    this.showToggleShareModal = false;
    this.selectedServiceForShare = null;
  }

  onConfirmToggleShare(): void {
    if (!this.selectedServiceForShare?.userSubscription?.id) {
      this.showErrorToast('Không thể thay đổi trạng thái chia sẻ');
      return;
    }

    const newShareStatus = !this.selectedServiceForShare.userSubscription.isShared;
    
    this.userSubcriptionService.setStatusShareSuubcriptionServiceByUser_subcriptionServiceIdAndIsShare(
      this.selectedServiceForShare.userSubscription.id,
      newShareStatus
    ).subscribe({
      next: () => {
        this.showSuccessToast(
          newShareStatus 
            ? 'Đã bật chia sẻ dịch vụ thành công!' 
            : 'Đã tắt chia sẻ dịch vụ thành công!'
        );
        this.showToggleShareModal = false;
        this.selectedServiceForShare = null;
        this.loadServices();
      },
      error: (error) => {
        console.error('Error toggling share status:', error);
        this.showErrorToast('Không thể thay đổi trạng thái chia sẻ. Vui lòng thử lại.');
      }
    });
  }

  onCancelSubscription(service: ServiceItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.closeActionsMenu();
    
    this.selectedServiceForCancellation = service;
    this.showCancelModal = true;
  }

  onCloseCancelModal(): void {
    this.showCancelModal = false;
    this.selectedServiceForCancellation = null;
  }

  onConfirmCancel(): void {
    if (this.selectedServiceForCancellation && this.selectedServiceForCancellation.userSubscription?.subcriptionServiceId) {
      this.userSubcriptionService.cancleUserSubcriptionBySubcriptionServiceId(
        this.selectedServiceForCancellation.userSubscription.subcriptionServiceId
      ).subscribe({
        next: () => {
          this.showSuccessToast('Hủy dịch vụ thành công!');
          this.showCancelModal = false;
          this.selectedServiceForCancellation = null;
          this.loadServices();
        },
        error: (error) => {
          console.error('Error canceling subscription:', error);
          this.showErrorToast('Không thể hủy dịch vụ. Vui lòng thử lại.');
        }
      });
    }
  }

  trackByServiceId(index: number, service: ServiceItem): string {
    return service.id;
  }

  trackByChildServiceId(index: number, childService: ChildServiceViewDto): string {
    return childService.id || index.toString();
  }

  trackByOptionId(index: number, item: UsageHistoryItem): string {
    return item.userChildService.childServiceId || index.toString();
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

  formatDate(date?: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  }

  formatDateTime(date?: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('vi-VN');
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

  getDurationTextForUserChild(item: UsageHistoryItem): string {
    if (item.userChildService?.isLifeTime) {
      return 'Vĩnh viễn';
    }
    
    const dayDuration = item.childServiceDetail?.dayDuration;
    if (dayDuration) {
      if (dayDuration < 7) {
        return `${dayDuration} ngày`;
      } else if (dayDuration % 7 === 0) {
        return `${dayDuration / 7} tuần`;
      } else {
        return `${dayDuration} ngày`;
      }
    }
    return '-';
  }

  getServiceActionLabel(action?: SubcriptionContance_ServiceAction): string {
    const labels: Record<SubcriptionContance_ServiceAction, string> = {
      [SubcriptionContance_ServiceAction.BoostScoreJob]: 'Tăng điểm việc làm',
      [SubcriptionContance_ServiceAction.TopList]: 'Đưa lên đầu danh sách',
      [SubcriptionContance_ServiceAction.JobBadge]: 'Huy hiệu việc làm',
      [SubcriptionContance_ServiceAction.ThemeCompany]: 'Giao diện công ty'
    };
    return action !== undefined ? labels[action] : '-';
  }

  getServiceTargetLabel(target?: SubcriptionContance_ServiceTarget): string {
    const labels: Record<SubcriptionContance_ServiceTarget, string> = {
      [SubcriptionContance_ServiceTarget.JobPost]: 'Bài đăng việc làm',
      [SubcriptionContance_ServiceTarget.Company]: 'Công ty'
    };
    return target !== undefined ? labels[target] : '-';
  }

  getChildServiceStatusLabel(status?: SubcriptionContance_ChildServiceStatus): string {
    const labels: Record<number, string> = {
      0: 'Không hoạt động',
      1: 'Đang hoạt động',
      2: 'Hết hạn',
      3: 'Đã hủy',
      4: 'Hết lượt sử dụng'
    };
    return status !== undefined ? labels[status] : '-';
  }

  getChildServiceStatusClass(status?: SubcriptionContance_ChildServiceStatus): string {
    const classes: Record<number, string> = {
      0: 'status-inactive',
      1: 'status-active',
      2: 'status-expired',
      3: 'status-cancelled',
      4: 'status-limit-reached'
    };
    return status !== undefined ? classes[status] : '';
  }

  getRemainingUsageForChild(childService: ChildServiceViewDto): string {
    if (!this.selectedServiceForDetails?.childServices) return '-';
    
    const matchingChild = this.selectedServiceForDetails.childServices.find(
      cs => cs.childService.id === childService.id
    );
    
    if (!matchingChild) {
      if (childService.isLifeTime) return 'Vĩnh viễn';
      if (!childService.isLimitUsedTime) return 'Không giới hạn';
      return `${childService.timeUsedLimit || 0}`;
    }
    
    const userChildService = matchingChild.userChildService;
    
    if (userChildService.isLifeTime) return 'Vĩnh viễn';
    if (!userChildService.isLimitUsedTime) return 'Không giới hạn';
    
    const used = userChildService.usedTime || 0;
    const total = userChildService.totalUsageLimit || 0;
    const remaining = total - used;
    
    return `${remaining}`;
  }

  getUsedTimeForChild(childService: ChildServiceViewDto): number {
    if (!this.selectedServiceForDetails?.childServices) return 0;
    
    const matchingChild = this.selectedServiceForDetails.childServices.find(
      cs => cs.childService.id === childService.id
    );
    
    return matchingChild?.userChildService?.usedTime || 0;
  }

  getTotalUsageLimitForChild(childService: ChildServiceViewDto): number {
    if (!this.selectedServiceForDetails?.childServices) {
      return childService.isLimitUsedTime ? (childService.timeUsedLimit || 0) : 0;
    }
    
    const matchingChild = this.selectedServiceForDetails.childServices.find(
      cs => cs.childService.id === childService.id
    );
    
    if (matchingChild?.userChildService) {
      return matchingChild.userChildService.totalUsageLimit || 0;
    }
    
    return childService.isLimitUsedTime ? (childService.timeUsedLimit || 0) : 0;
  }

  getRemainingDays(endDate?: string): number {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container') && !target.closest('.actions-menu')) {
      this.closeActionsMenu();
    }
  }
}