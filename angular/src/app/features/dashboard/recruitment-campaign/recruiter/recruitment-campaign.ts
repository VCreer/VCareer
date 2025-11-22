import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  InputFieldComponent,
  SelectFieldComponent,
  ButtonComponent,
  SelectOption,
  GenericModalComponent,
  ToastNotificationComponent,
  MultiSelectLocationComponent,
  ToggleSwitchComponent,
  PaginationComponent
} from '../../../../shared/components';
import { JobOptionsService } from '../../../../shared/services/job-options.service';

export interface ActivityOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

export interface ActivityCategory {
  id: string;
  title: string;
  description?: string;
  options: ActivityOption[];
}

export interface Campaign {
  id: string;
  name: string;
  position: string;
  workLocations: string[];
  isActive: boolean;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  appliedCvs: number; // Số CV ứng tuyển
  jobPosts: number;
}

@Component({
  selector: 'app-recruitment-campaign',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputFieldComponent,
    SelectFieldComponent,
    ButtonComponent,
    GenericModalComponent,
    ToastNotificationComponent,
    MultiSelectLocationComponent,
    ToggleSwitchComponent,
    PaginationComponent
  ],
  templateUrl: './recruitment-campaign.html',
  styleUrls: ['./recruitment-campaign.scss']
})
export class RecruitmentCampaignComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;
  private jobOptionsService = inject(JobOptionsService);

  // View mode: 'create' or 'manage'
  viewMode: 'create' | 'manage' = 'create';

  // Campaigns list
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  paginatedCampaigns: Campaign[] = [];
  searchQuery: string = '';
  filterType: string = 'all'; // 'all', 'active', 'inactive'
  showActionsMenu: string | null = null; // Track which campaign's action menu is open
  private scrollListener?: () => void;
  private currentMenuCampaignId: string | null = null;
  private currentMenuButton: HTMLElement | null = null;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Date Range Picker
  showDateRangeDropdown = false;
  selectedTimeRange = '';
  timeRanges = [
    { id: 'all', name: 'Tất cả thời gian' },
    { id: 'today', name: 'Hôm nay' },
    { id: 'week', name: 'Tuần này' },
    { id: 'month', name: 'Tháng này' },
    { id: 'year', name: 'Năm nay' }
  ];
  dateRange = {
    startDate: null as Date | null,
    endDate: null as Date | null
  };
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  nextCalendarMonth = new Date().getMonth() + 1;
  nextCalendarYear = new Date().getFullYear();
  weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  calendarDays: any[] = [];
  nextCalendarDays: any[] = [];
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;

  // Form data
  campaignForm = {
    campaignName: '',
    position: '',
    workLocations: [] as string[] // Changed to array for multi-select
  };

  // Options
  locationOptions: SelectOption[] = this.jobOptionsService.LOCATION_OPTIONS;
  positionOptions: SelectOption[] = this.jobOptionsService.JOB_POSITION_OPTIONS;


  // Validation errors
  validationErrors: { [key: string]: string } = {};

  // Modal state
  showActivityModal = false;
  selectedActivity: ActivityOption | null = null;
  
  // Edit campaign modal state
  showEditModal = false;
  editingCampaign: Campaign | null = null;
  editCampaignName: string = '';

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Activity categories and options
  activityCategories: ActivityCategory[] = [
    {
      id: 'attract-applications',
      title: 'Thu hút ứng tuyển tự nhiên',
      options: [
        {
          id: 'post-job',
          title: 'Đăng tin tuyển dụng',
          description: 'Đăng tin tuyển dụng tiếp cận 3 triệu ứng viên tiềm năng & nhận về CV ứng tuyến',
          icon: 'fa-pencil',
          recommended: true
        }
      ]
    },
    {
      id: 'hunt-candidates',
      title: 'Săn tìm ứng viên',
      options: [
        {
          id: 'scout-ai',
          title: 'Scout AI - Tự động săn tìm CV',
          description: 'Sử dụng công nghệ AI để tự động tìm kiếm và đề xuất CV phù hợp nhất với yêu cầu công việc',
          icon: 'fa-robot'
        },
        {
          id: 'filter-topcv',
          title: 'Lọc CV ứng viên TopCV',
          description: 'Tìm kiếm và lọc CV ứng viên từ kho dữ liệu TopCV với nhiều tiêu chí lọc chi tiết',
          icon: 'fa-filter'
        }
      ]
    }
  ];

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Load campaigns from localStorage if available (for persistence)
    this.loadCampaignsFromStorage();

    // Set view mode based on whether campaigns exist
    if (this.campaigns.length > 0) {
      this.viewMode = 'manage';
    } else {
      this.viewMode = 'create';
    }

    // Initialize filtered campaigns
    this.generateCalendar();
    this.generateNextCalendar();
    this.filterCampaigns();
  }

  private loadCampaignsFromStorage(): void {
    try {
      const stored = localStorage.getItem('recruitment_campaigns');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old campaign data to new structure
        this.campaigns = parsed.map((campaign: any) => this.migrateCampaign(campaign));
        this.saveCampaignsToStorage(); // Save migrated data
      } else {
        // For testing: Add a mock campaign if no campaigns exist
        this.addMockCampaign();
      }
    } catch (error) {
      console.error('Error loading campaigns from storage:', error);
      // Add mock campaign on error for testing
      this.addMockCampaign();
    }
  }

  private migrateCampaign(campaign: any): Campaign {
    // If campaign already has new structure, return as is
    if (campaign.startDate && campaign.endDate && campaign.hasOwnProperty('appliedCvs')) {
      return campaign as Campaign;
    }

    // Migrate old campaign structure to new one
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      id: campaign.id || `#${Math.floor(Math.random() * 10000000)}`,
      name: campaign.name || '',
      position: campaign.position || '',
      workLocations: campaign.workLocations || [],
      isActive: campaign.isActive !== undefined ? campaign.isActive : true,
      startDate: campaign.startDate || formatDate(today),
      endDate: campaign.endDate || formatDate(endDate),
      appliedCvs: campaign.appliedCvs !== undefined ? campaign.appliedCvs : (campaign.cvCount || 0),
      jobPosts: campaign.jobPosts || 0
    };
  }

  // Helper method to add a mock campaign for testing
  private addMockCampaign(): void {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const mockCampaign: Campaign = {
      id: '#2326176',
      name: 'Tuyển dụng MKT',
      position: 'marketing-manager',
      workLocations: ['ho-chi-minh'],
      isActive: true,
      startDate: formatDate(today),
      endDate: formatDate(endDate),
      appliedCvs: 0,
      jobPosts: 0
    };
    this.campaigns.push(mockCampaign);
    this.saveCampaignsToStorage();
  }

  private saveCampaignsToStorage(): void {
    try {
      localStorage.setItem('recruitment_campaigns', JSON.stringify(this.campaigns));
    } catch (error) {
      console.error('Error saving campaigns to storage:', error);
    }
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  getFieldError(fieldName: string): string {
    return this.validationErrors[fieldName] || '';
  }

  clearFieldError(fieldName: string): void {
    if (this.validationErrors[fieldName]) {
      delete this.validationErrors[fieldName];
    }
  }

  onFieldChange(fieldName: string): void {
    this.clearFieldError(fieldName);
  }

  onLocationChange(locations: string[]): void {
    this.campaignForm.workLocations = locations;
    this.clearFieldError('workLocations');
  }

  onLocationErrorChange(error: string): void {
    if (error) {
      this.validationErrors['workLocations'] = error;
    } else {
      this.clearFieldError('workLocations');
    }
  }


  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.campaignForm.campaignName || this.campaignForm.campaignName.trim() === '') {
      this.validationErrors['campaignName'] = 'Vui lòng nhập tên chiến dịch tuyển dụng';
    }

    if (!this.campaignForm.position || this.campaignForm.position === '') {
      this.validationErrors['position'] = 'Vui lòng chọn vị trí tuyển dụng';
    }

    if (!this.campaignForm.workLocations || this.campaignForm.workLocations.length === 0) {
      this.validationErrors['workLocations'] = 'Vui lòng chọn ít nhất một khu vực làm việc';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  onNext(): void {
    if (!this.validateForm()) {
      return;
    }

    // Set default selected activity to recommended one
    let recommendedActivity: ActivityOption | null = null;
    for (const category of this.activityCategories) {
      recommendedActivity = category.options.find(opt => opt.recommended) || null;
      if (recommendedActivity) {
        break;
      }
    }
    
    if (recommendedActivity) {
      this.selectedActivity = recommendedActivity;
    }

    // Show modal
    this.showActivityModal = true;
  }

  onCloseModal(): void {
    this.showActivityModal = false;
  }

  onActivityAction(): void {
    if (!this.selectedActivity) return;

    // Handle action based on selected activity
    switch (this.selectedActivity.id) {
      case 'post-job':
        // Create campaign and save it
        this.createCampaign();
        // Navigate to job posting page with campaign name
        this.router.navigate(['/recruiter/job-posting'], {
          queryParams: {
            campaignName: this.campaignForm.campaignName,
            position: this.campaignForm.position,
            workLocations: this.campaignForm.workLocations.join(',')
          }
        });
        break;
      case 'scout-ai':
        // Create campaign first
        this.createCampaign();
        // TODO: Implement Scout AI
        break;
      case 'filter-topcv':
        // Create campaign first
        this.createCampaign();
        // TODO: Implement CV filter
        break;
    }

    // Close modal after action
    this.onCloseModal();
  }

  createCampaign(): void {
    // Generate campaign ID
    const campaignId = '#' + Math.floor(Math.random() * 10000000).toString();
    
    // Get current date and set end date to 30 days from now
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Create new campaign
    const newCampaign: Campaign = {
      id: campaignId,
      name: this.campaignForm.campaignName,
      position: this.campaignForm.position,
      workLocations: this.campaignForm.workLocations,
      isActive: true,
      startDate: formatDate(today),
      endDate: formatDate(endDate),
      appliedCvs: 0,
      jobPosts: 0
    };

    // Add to campaigns list
    this.campaigns.push(newCampaign);
    
    // Save to localStorage
    this.saveCampaignsToStorage();
    
    // Switch to manage view
    this.viewMode = 'manage';
    this.filterCampaigns();
    
    // Reset form
    this.campaignForm = {
      campaignName: '',
      position: '',
      workLocations: []
    };
  }

  onCreateNewCampaign(): void {
    this.viewMode = 'create';
    this.campaignForm = {
      campaignName: '',
      position: '',
      workLocations: []
    };
    this.validationErrors = {};
  }

  onSearchCampaigns(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.filterCampaigns();
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.filterCampaigns();
  }

  filterCampaigns(): void {
    let filtered = [...this.campaigns];

    // Filter by type
    if (this.filterType === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (this.filterType === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.position.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (this.dateRange.startDate || this.dateRange.endDate) {
      filtered = filtered.filter(c => {
        const startDate = new Date(c.startDate);
        const endDate = new Date(c.endDate);
        
        if (this.dateRange.startDate && endDate < this.dateRange.startDate) {
          return false;
        }
        if (this.dateRange.endDate) {
          const filterEndDate = new Date(this.dateRange.endDate);
          filterEndDate.setHours(23, 59, 59, 999);
          if (startDate > filterEndDate) {
            return false;
          }
        }
        return true;
      });
    }

    this.filteredCampaigns = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCampaigns.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCampaigns = this.filteredCampaigns.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  onToggleCampaign(campaign: Campaign, isActive: boolean): void {
    campaign.isActive = isActive;
    // Save to localStorage
    this.saveCampaignsToStorage();
    // Show toast notification
    const status = isActive ? 'kích hoạt' : 'tắt';
    this.showToastMessage(`Đã ${status} chiến dịch "${campaign.name}" thành công!`, 'success');
  }

  getPositionLabel(value: string): string {
    return this.jobOptionsService.getJobPositionLabel(value);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  toggleActionsMenu(campaignId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.showActionsMenu === campaignId) {
      this.closeActionsMenu();
    } else {
      this.closeActionsMenu();
      this.showActionsMenu = campaignId;
      this.currentMenuCampaignId = campaignId;
      if (event) {
        const button = (event.target as HTMLElement).closest('.actions-btn') as HTMLElement;
        this.currentMenuButton = button || null;
      }
      setTimeout(() => {
        this.positionActionsMenu(campaignId, event);
        this.setupScrollListener(campaignId);
      }, 0);
    }
  }

  private closeActionsMenu(): void {
    this.showActionsMenu = null;
    this.currentMenuCampaignId = null;
    this.currentMenuButton = null;
    this.removeScrollListener();
  }

  private setupScrollListener(campaignId: string): void {
    this.removeScrollListener();
    
    this.scrollListener = () => {
      if (this.showActionsMenu === campaignId && this.currentMenuCampaignId === campaignId) {
        this.updateMenuPosition(campaignId);
      }
    };
    
    window.addEventListener('scroll', this.scrollListener, true);
    window.addEventListener('resize', this.scrollListener);
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      window.removeEventListener('resize', this.scrollListener);
      this.scrollListener = undefined;
    }
  }

  private getSidebarWidth(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return 0;
    
    const pageElement = document.querySelector('.recruitment-campaign-page');
    if (pageElement && pageElement.classList.contains('sidebar-expanded')) {
      return 280;
    }
    return 72;
  }

  private updateMenuPosition(campaignId: string): void {
    const container = document.querySelector(`[data-campaign-id="${campaignId}"]`);
    if (!container) {
      setTimeout(() => this.updateMenuPosition(campaignId), 10);
      return;
    }
    
    const actionsMenu = container.querySelector('.actions-menu') as HTMLElement;
    const button = this.currentMenuButton;
    
    if (!actionsMenu || !button) {
      // Retry after a short delay if menu not found
      if (!actionsMenu) {
        setTimeout(() => this.updateMenuPosition(campaignId), 10);
      }
      return;
    }
    
    const rect = button.getBoundingClientRect();
    const menuWidth = actionsMenu.offsetWidth || 180;
    const sidebarWidth = this.getSidebarWidth();
    const viewportWidth = window.innerWidth;
    const padding = 8;
    
    // Position menu below button, aligned to right
    let left = rect.right - menuWidth;
    
    // Ensure menu doesn't go off left edge (consider sidebar)
    const minLeft = sidebarWidth + padding;
    if (left < minLeft) {
      left = Math.max(minLeft, rect.left);
    }
    
    // Ensure menu doesn't go off right edge
    const maxLeft = viewportWidth - menuWidth - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    
    actionsMenu.style.top = `${rect.bottom + 4}px`;
    actionsMenu.style.left = `${left}px`;
  }

  private positionActionsMenu(campaignId: string, event?: Event): void {
    // Use stored button reference if available, otherwise try to find from event
    if (!this.currentMenuButton && event) {
      const button = (event.target as HTMLElement).closest('.actions-btn') as HTMLElement;
      this.currentMenuButton = button || null;
    }
    
    if (!this.currentMenuButton) return;
    
    this.updateMenuPosition(campaignId);
  }

  onViewCampaign(campaign: Campaign): void {
    this.router.navigate(['/recruiter/campaign-detail'], {
      queryParams: {
        campaignId: campaign.id,
        campaignName: campaign.name
      }
    });
    this.closeActionsMenu();
  }

  onViewJobs(campaign: Campaign): void {
    this.router.navigate(['/recruiter/campaign-job-management'], {
      queryParams: {
        campaignId: campaign.id,
        campaignName: campaign.name
      }
    });
    this.closeActionsMenu();
  }

  onViewAppliedCvs(campaign: Campaign): void {
    // TODO: Navigate to applied CVs page for this campaign
    this.router.navigate(['/recruiter/cv-management'], {
      queryParams: {
        campaignId: campaign.id,
        campaignName: campaign.name
      }
    });
  }

  onEditCampaign(campaign: Campaign): void {
    this.editingCampaign = campaign;
    this.editCampaignName = campaign.name;
    this.showEditModal = true;
    this.closeActionsMenu();
  }

  onCloseEditModal(): void {
    this.showEditModal = false;
    this.editingCampaign = null;
    this.editCampaignName = '';
    this.validationErrors = {};
  }

  onSaveEditCampaign(): void {
    if (!this.editingCampaign) return;

    // Validate
    if (!this.editCampaignName || this.editCampaignName.trim() === '') {
      this.validationErrors['editCampaignName'] = 'Vui lòng nhập tên chiến dịch tuyển dụng';
      this.showToastMessage('Vui lòng nhập tên chiến dịch tuyển dụng', 'error');
      return;
    }

    // Update campaign
    const index = this.campaigns.findIndex(c => c.id === this.editingCampaign!.id);
    if (index > -1) {
      this.campaigns[index].name = this.editCampaignName.trim();
      this.saveCampaignsToStorage();
      this.filterCampaigns();
      this.showToastMessage('Cập nhật chiến dịch tuyển dụng thành công!', 'success');
    } else {
      this.showToastMessage('Không tìm thấy chiến dịch để cập nhật', 'error');
    }

    // Close modal
    this.onCloseEditModal();
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onCloseToast(): void {
    this.showToast = false;
  }

  onDeleteCampaign(campaign: Campaign): void {
    if (confirm(`Bạn có chắc chắn muốn xóa chiến dịch "${campaign.name}"?`)) {
      const index = this.campaigns.findIndex(c => c.id === campaign.id);
      if (index > -1) {
        this.campaigns.splice(index, 1);
        this.saveCampaignsToStorage();
        this.filterCampaigns();
        this.showToastMessage(`Đã xóa chiến dịch "${campaign.name}" thành công!`, 'success');
      } else {
        this.showToastMessage('Không tìm thấy chiến dịch để xóa', 'error');
      }
    }
    this.closeActionsMenu();
  }

  // Date Range Picker Methods
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Close date range dropdown if clicking outside
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.showDateRangeDropdown = false;
    }
    
    // Close actions menu if clicking outside
    if (!target.closest('.actions-menu-container')) {
      this.closeActionsMenu();
    }
  }

  toggleDateRangeDropdown(): void {
    this.showDateRangeDropdown = !this.showDateRangeDropdown;
    if (this.showDateRangeDropdown) {
      this.tempStartDate = this.dateRange.startDate ? new Date(this.dateRange.startDate) : null;
      this.tempEndDate = this.dateRange.endDate ? new Date(this.dateRange.endDate) : null;
      if (this.tempStartDate) {
        this.currentMonth = this.tempStartDate.getMonth();
        this.currentYear = this.tempStartDate.getFullYear();
      } else {
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
      }
      if (this.currentMonth === 11) {
        this.nextCalendarMonth = 0;
        this.nextCalendarYear = this.currentYear + 1;
      } else {
        this.nextCalendarMonth = this.currentMonth + 1;
        this.nextCalendarYear = this.currentYear;
      }
      this.generateCalendar();
      this.generateNextCalendar();
    }
  }

  clearDateRangeFilter(): void {
    this.selectedTimeRange = '';
    this.dateRange.startDate = null;
    this.dateRange.endDate = null;
    this.tempStartDate = null;
    this.tempEndDate = null;
    this.generateCalendar();
    this.generateNextCalendar();
    this.currentPage = 1;
    this.filterCampaigns();
  }

  selectTimeRange(timeRangeId: string): void {
    this.selectedTimeRange = timeRangeId;
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    switch (timeRangeId) {
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart;
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
    }
    
    this.tempStartDate = startDate ? new Date(startDate) : null;
    this.tempEndDate = endDate ? new Date(endDate) : null;
    
    if (startDate) {
      this.currentMonth = startDate.getMonth();
      this.currentYear = startDate.getFullYear();
      if (this.currentMonth === 11) {
        this.nextCalendarMonth = 0;
        this.nextCalendarYear = this.currentYear + 1;
      } else {
        this.nextCalendarMonth = this.currentMonth + 1;
        this.nextCalendarYear = this.currentYear;
      }
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ date: '', disabled: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
  }

  generateNextCalendar(): void {
    this.nextCalendarDays = [];
    const firstDay = new Date(this.nextCalendarYear, this.nextCalendarMonth, 1);
    const lastDay = new Date(this.nextCalendarYear, this.nextCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.nextCalendarDays.push({ date: '', disabled: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.nextCalendarYear, this.nextCalendarMonth, day);
      this.nextCalendarDays.push({
        date: day,
        fullDate: date,
        disabled: false
      });
    }
  }

  getCurrentMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.currentMonth]} ${this.currentYear}`;
  }

  getNextMonthYear(): string {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.nextCalendarMonth]} ${this.nextCalendarYear}`;
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    
    if (this.currentMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear = this.currentYear + 1;
    } else {
      this.nextCalendarMonth = this.currentMonth + 1;
      this.nextCalendarYear = this.currentYear;
    }
    
    this.generateCalendar();
    this.generateNextCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    
    if (this.currentMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear = this.currentYear + 1;
    } else {
      this.nextCalendarMonth = this.currentMonth + 1;
      this.nextCalendarYear = this.currentYear;
    }
    
    this.generateCalendar();
    this.generateNextCalendar();
  }

  nextNextMonth(): void {
    if (this.nextCalendarMonth === 11) {
      this.nextCalendarMonth = 0;
      this.nextCalendarYear++;
    } else {
      this.nextCalendarMonth++;
    }
    if (this.nextCalendarMonth === 0) {
      this.currentMonth = 11;
      this.currentYear = this.nextCalendarYear - 1;
    } else {
      this.currentMonth = this.nextCalendarMonth - 1;
      this.currentYear = this.nextCalendarYear;
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }

  selectDate(day: any): void {
    if (day.disabled || !day.fullDate) return;
    
    this.selectedTimeRange = '';
    
    if (!this.tempStartDate || (this.tempStartDate && this.tempEndDate)) {
      this.tempStartDate = day.fullDate;
      this.tempEndDate = null;
    } else {
      if (day.fullDate < this.tempStartDate!) {
        this.tempEndDate = this.tempStartDate;
        this.tempStartDate = day.fullDate;
      } else {
        this.tempEndDate = day.fullDate;
      }
    }
    this.generateCalendar();
    this.generateNextCalendar();
  }

  isDateSelected(day: any): boolean {
    if (!day.fullDate) return false;
    const date = day.fullDate;
    return (this.tempStartDate && this.isSameDay(date, this.tempStartDate)) ||
           (this.tempEndDate && this.isSameDay(date, this.tempEndDate));
  }

  isDateInRange(day: any): boolean {
    if (!day.fullDate || !this.tempStartDate || !this.tempEndDate) return false;
    const date = day.fullDate;
    return date >= this.tempStartDate && date <= this.tempEndDate;
  }

  isStartDate(day: any): boolean {
    if (!day.fullDate || !this.tempStartDate) return false;
    return this.isSameDay(day.fullDate, this.tempStartDate);
  }

  isEndDate(day: any): boolean {
    if (!day.fullDate || !this.tempEndDate) return false;
    return this.isSameDay(day.fullDate, this.tempEndDate);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  applyDateRange(): void {
    this.dateRange.startDate = this.tempStartDate;
    this.dateRange.endDate = this.tempEndDate;
    this.showDateRangeDropdown = false;
    this.currentPage = 1;
    this.filterCampaigns();
  }

  cancelDateRange(): void {
    this.tempStartDate = this.dateRange.startDate ? new Date(this.dateRange.startDate) : null;
    this.tempEndDate = this.dateRange.endDate ? new Date(this.dateRange.endDate) : null;
    this.showDateRangeDropdown = false;
    this.generateCalendar();
    this.generateNextCalendar();
  }

  getSelectedDateRangeName(): string {
    if (this.dateRange.startDate && this.dateRange.endDate) {
      const start = this.formatDateRange(this.dateRange.startDate);
      const end = this.formatDateRange(this.dateRange.endDate);
      return `${start} - ${end}`;
    }
    const timeRange = this.timeRanges.find(t => t.id === this.selectedTimeRange);
    return timeRange ? timeRange.name : 'Tất cả thời gian';
  }

  isTimeRangeSelected(timeRangeId: string): boolean {
    if (this.selectedTimeRange === timeRangeId) {
      return true;
    }
    const today = new Date();
    let matches = false;
    
    switch (timeRangeId) {
      case 'all':
        matches = !this.tempStartDate && !this.tempEndDate;
        break;
      case 'today':
        if (this.tempStartDate && this.tempEndDate) {
          matches = this.isSameDay(this.tempStartDate, today) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'week':
        if (this.tempStartDate && this.tempEndDate) {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          matches = this.isSameDay(this.tempStartDate, weekStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'month':
        if (this.tempStartDate && this.tempEndDate) {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          matches = this.isSameDay(this.tempStartDate, monthStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
      case 'year':
        if (this.tempStartDate && this.tempEndDate) {
          const yearStart = new Date(today.getFullYear(), 0, 1);
          matches = this.isSameDay(this.tempStartDate, yearStart) && this.isSameDay(this.tempEndDate, today);
        }
        break;
    }
    
    return matches;
  }

  formatDateRange(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }
}