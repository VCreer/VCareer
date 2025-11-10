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
  ToggleSwitchComponent
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
    ToggleSwitchComponent
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
  searchQuery: string = '';
  filterType: string = 'all'; // 'all', 'active', 'inactive'
  showActionsMenu: string | null = null; // Track which campaign's action menu is open

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
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close actions menu when clicking outside
    if (this.showActionsMenu) {
      this.showActionsMenu = null;
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
    this.filterCampaigns();
  }

  onFilterChange(): void {
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

    this.filteredCampaigns = filtered;
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
      this.showActionsMenu = null;
    } else {
      this.showActionsMenu = campaignId;
      // Position menu using fixed positioning
      setTimeout(() => {
        this.positionActionsMenu(campaignId, event);
      }, 0);
    }
  }

  private positionActionsMenu(campaignId: string, event?: Event): void {
    if (!event) return;

    const button = (event.target as HTMLElement).closest('.actions-btn') as HTMLElement;
    if (!button) return;

    const container = button.closest(`[data-campaign-id="${campaignId}"]`);
    if (!container) return;

    const actionsMenu = container.querySelector('.actions-menu') as HTMLElement;
    if (!actionsMenu) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 180; // min-width from CSS
    
    // Position menu below button, aligned to right
    // Use viewport coordinates for fixed positioning
    let left = rect.right - menuWidth;
    
    // Ensure menu doesn't go off left edge
    if (left < 8) {
      left = rect.left;
    }
    
    actionsMenu.style.top = `${rect.bottom + 4}px`;
    actionsMenu.style.left = `${left}px`;
  }

  onViewCampaign(campaign: Campaign): void {
    this.router.navigate(['/recruiter/campaign-detail'], {
      queryParams: {
        campaignId: campaign.id,
        campaignName: campaign.name
      }
    });
    this.showActionsMenu = null;
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
    this.showActionsMenu = null;
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
    this.showActionsMenu = null;
  }

}

