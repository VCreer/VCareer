import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  InputFieldComponent,
  ButtonComponent,
  GenericModalComponent,
  ToastNotificationComponent,
  MultiSelectLocationComponent,
  ToggleSwitchComponent,
  PaginationComponent,
  SelectFieldComponent,
  SelectOption,
} from '../../../../shared/components';
import { AuthService } from 'src/app/proxy/services/auth';
import { RecruitmentCompainService } from 'src/app/proxy/services/job';
import {
  RecruimentCampainViewDto,
  RecruimentCampainCreateDto,
  RecruimentCampainUpdateDto,
} from 'src/app/proxy/dto/job-dto';
import { ToasterService } from '@abp/ng.theme.shared';
import { GeoService} from 'src/app/proxy/services/geo';
import { ProvinceDto } from 'src/app/proxy/dto/geo-dto';

interface Campaign extends RecruimentCampainViewDto {
  appliedCvs?: number;
  jobCount?: number;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-recruitment-campaign',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputFieldComponent,
    ButtonComponent,
    GenericModalComponent,
    ToastNotificationComponent,
    MultiSelectLocationComponent,
    ToggleSwitchComponent,
    PaginationComponent,
    SelectFieldComponent,
  ],
  templateUrl: './recruitment-campaign.html',
  styleUrls: ['./recruitment-campaign.scss'],
})
export class RecruitmentCampaignComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  viewMode: 'create' | 'manage' = 'manage';

  // Data
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  paginatedCampaigns: Campaign[] = [];

  // Form tạo chiến dịch
  campaignForm = {
    campaignName: '',
  };
  isCreating = false;

  // Location options
  locationOptions: { label: string; value: string }[] = [];

  // Filters & Pagination
  searchQuery = '';
  filterType: 'all' | 'active' | 'inactive' = 'all';
  filterOptions: SelectOption[] = [
    { value: 'all', label: 'Tất cả chiến dịch' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Đã tắt' },
  ];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Modals
  showActivityModal = false;
  showEditModal = false;
  editingCampaign: Campaign | null = null;
  editCampaignName = '';

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Loading state
  loading = true;
  showActionsMenu: string | null = null;
  menuPosition: { top: number; left: number; maxWidth?: number } | null = null;

  // Khóa để ngăn double request
  private isTogglingCampaign = false;
  private isSavingEdit = false;
  private isDeletingCampaign = false;

  private sidebarCheckInterval: any;

  constructor(
    private authService: AuthService,
    private campaignService: RecruitmentCompainService,
    private geoService: GeoService,
    private toaster: ToasterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.startSidebarCheck();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) clearInterval(this.sidebarCheckInterval);
  }

  private startSidebarCheck() {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => this.checkSidebarState(), 100);
  }

  private checkSidebarState() {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show') || sidebar.offsetWidth > 100;
    }
  }

  // Load danh sách tỉnh/thành
  private loadProvinces() {
    this.geoService.getProvinces().subscribe({
      next: (provinces: ProvinceDto[]) => {
        this.locationOptions = provinces.map(p => ({
          label: p.name || '',
          value: p.code?.toString() || '',
        }));
      },
      error: () => this.toaster.error('Không tải được danh sách tỉnh/thành'),
    });
  }

  // Load campaigns - thử dùng API loadRecruitmentCompainByIsActive trước, nếu không có dữ liệu thì thử API theo recruiterId
  private loadCampaigns() {
    this.loading = true;

    // Thử load bằng API loadRecruitmentCompainByIsActive
    const loadActive = this.campaignService.loadRecruitmentCompainByIsActive(true).toPromise().catch((err) => {
      console.error('Lỗi khi load campaigns active:', err);
      return [];
    });
    const loadInactive = this.campaignService.loadRecruitmentCompainByIsActive(false).toPromise().catch((err) => {
      console.error('Lỗi khi load campaigns inactive:', err);
      return [];
    });

    Promise.all([loadActive, loadInactive]).then(([active, inactive]) => {
      console.log('Active campaigns:', active);
      console.log('Inactive campaigns:', inactive);
      const all = [...(active || []), ...(inactive || [])];
      console.log('All campaigns từ loadRecruitmentCompainByIsActive:', all);

      // Nếu không có dữ liệu, thử load theo recruiterId
      if (all.length === 0) {
        this.loadCampaignsByRecruiterId();
      } else {
        this.campaigns = this.mapToCampaign(all);
        this.filterCampaigns();
        this.viewMode = this.campaigns.length == 0 ? 'create' : 'manage';
        this.loading = false;
      }
    });
  }

  // Load campaigns theo recruiterId
  private loadCampaignsByRecruiterId() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!user?.userId) {
          console.error('Không lấy được userId từ current user');
          this.loading = false;
          return;
        }

        const recruiterId = user.userId;
        console.log('Loading campaigns cho recruiterId:', recruiterId);

        const loadActive = this.campaignService
          .getCompainsByRecruiterIdByRecruiterIdAndIsActive(recruiterId, true)
          .toPromise()
          .catch((err) => {
            console.error('Lỗi khi load campaigns active theo recruiterId:', err);
            return [];
          });
        const loadInactive = this.campaignService
          .getCompainsByRecruiterIdByRecruiterIdAndIsActive(recruiterId, false)
          .toPromise()
          .catch((err) => {
            console.error('Lỗi khi load campaigns inactive theo recruiterId:', err);
            return [];
          });

        Promise.all([loadActive, loadInactive]).then(([active, inactive]) => {
          console.log('Active campaigns theo recruiterId:', active);
          console.log('Inactive campaigns theo recruiterId:', inactive);
          const all = [...(active || []), ...(inactive || [])];
          console.log('All campaigns từ getCompainsByRecruiterId:', all);
          this.campaigns = this.mapToCampaign(all);
          this.filterCampaigns();
          this.viewMode = this.campaigns.length == 0 ? 'create' : 'manage';
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Lỗi khi lấy current user:', err);
        this.loading = false;
        this.toaster.error('Không thể tải thông tin người dùng');
      },
    });
  }

  private mapToCampaign(dtos: RecruimentCampainViewDto[]): Campaign[] {
    return dtos.map(dto => ({
      ...dto,
      id: dto.id.toString(),
      appliedCvs: 0,
      jobCount: 0,
      startDate: this.formatDate(dto.creationTime),
      endDate: this.formatDate(dto.lastModificationTime || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    }));
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Tạo chiến dịch mới
  onNext() {
    if (this.isCreating || !this.validateForm()) return;

    this.isCreating = true;

    const input: RecruimentCampainCreateDto = {
      name: this.campaignForm.campaignName.trim(),
      isActive: true,
      description: '',
    };

    this.campaignService.createRecruitmentCompainByInput(input).subscribe({
      next: () => {
        this.toaster.success('Tạo chiến dịch thành công!');
        this.loadCampaigns();
        this.showActivityModal = true;
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        this.toaster.error('Tạo chiến dịch thất bại');
      },
      complete: () => {
        this.isCreating = false;
      }
    });
  }

  private resetForm() {
    this.validationErrors = {};
  }

  onActivityAction() {
    this.showActivityModal = false;
    this.router.navigate(['/recruiter/job-posting'], {
      queryParams: { campaignName: this.campaignForm.campaignName },
    });
  }

  // Bật/tắt chiến dịch
  onToggleCampaign(campaign: Campaign, checked: boolean) {
    // Ngăn double request
    if (this.isTogglingCampaign) return;
    
    this.isTogglingCampaign = true;

    this.campaignService
      .setRecruitmentCompainStatusByCompainIdAndIsActive(campaign.id!, checked)
      .subscribe({
        next: () => {
          campaign.isActive = checked;
          this.toaster.success(checked ? 'Đã kích hoạt chiến dịch' : 'Đã tắt chiến dịch');
        },
        error: () => {
          campaign.isActive = !checked;
          this.toaster.error('Cập nhật trạng thái thất bại');
        },
        complete: () => {
          this.isTogglingCampaign = false;
        }
      });
  }

  // Sửa tên chiến dịch
  onEditCampaign(campaign: Campaign) {
    this.editingCampaign = campaign;
    this.editCampaignName = campaign.name || '';
    this.showEditModal = true;
  }

  onSaveEditCampaign() {
    // Ngăn double request
    if (this.isSavingEdit) return;

    if (!this.editCampaignName.trim()) {
      this.toaster.error('Tên chiến dịch không được để trống');
      return;
    }

    this.isSavingEdit = true;

    const input: RecruimentCampainUpdateDto = {
      id: this.editingCampaign!.id,
      name: this.editCampaignName.trim(),
      description: this.editingCampaign!.description || '',
    };

    this.campaignService.updateRecruitmentCompainByInput(input).subscribe({
      next: () => {
        this.editingCampaign!.name = this.editCampaignName.trim();
        this.showEditModal = false;
        this.toaster.success('Cập nhật tên chiến dịch thành công');
      },
      error: () => {
        this.toaster.error('Cập nhật thất bại');
      },
      complete: () => {
        this.isSavingEdit = false;
      }
    });
  }

  // Filter & Pagination
  filterCampaigns() {
    let filtered = [...this.campaigns];

    if (this.filterType === 'active') filtered = filtered.filter(c => c.isActive);
    if (this.filterType === 'inactive') filtered = filtered.filter(c => !c.isActive);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      );
    }

    this.filteredCampaigns = filtered;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredCampaigns.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedCampaigns = this.filteredCampaigns.slice(start, start + this.itemsPerPage);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  onSearchCampaigns() {
    this.currentPage = 1;
    this.filterCampaigns();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.filterCampaigns();
  }

  // Validation
  validationErrors: { [key: string]: string } = {};

  validateForm(): boolean {
    this.validationErrors = {};
    if (!this.campaignForm.campaignName.trim()) {
      this.validationErrors['campaignName'] = 'Vui lòng nhập tên chiến dịch';
    }
    return Object.keys(this.validationErrors).length === 0;
  }

  getFieldError(field: string): string {
    return this.validationErrors[field] || '';
  }

  // Toast
  showToastMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  // Navigation
  onViewCampaign(campaign: Campaign) {
    this.router.navigate(['/recruiter/campaign-detail'], {
      queryParams: { campaignId: campaign.id },
    });
  }

  onViewJobs(campaign: Campaign) {
    this.router.navigate(['/recruiter/campaign-job-management'], {
      queryParams: { 
        campaignId: campaign.id,
        campaignName: campaign.name 
      }
    });
  }

  onCreateNewCampaign() {
    this.viewMode = 'create';
    this.campaignForm = { campaignName: ''};
    this.validationErrors = {};
  }

  toggleActionsMenu(campaignId: string, event: Event) {
    event.stopPropagation();
    const isOpening = this.showActionsMenu !== campaignId;
    this.showActionsMenu = isOpening ? campaignId : null;
    
    if (isOpening) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      this.updateMenuPosition(rect);
    } else {
      this.menuPosition = null;
    }
  }

  private updateMenuPosition(buttonRect: DOMRect) {
    // Đơn giản hóa: chỉ đặt menu ở vị trí mặc định bên phải button
    const menuGap = 8;
    const menuMinWidth = 180;
    const menuMaxWidth = 300;
    
    // Vị trí mặc định: bên phải button
    let menuLeft = buttonRect.right + menuGap;
    let top = buttonRect.bottom + menuGap;
    
    // Nếu không đủ chỗ bên phải, đặt menu bên trái button
    const viewportWidth = window.innerWidth;
    if (menuLeft + menuMinWidth > viewportWidth) {
      menuLeft = buttonRect.left - menuMaxWidth - menuGap;
    }
    
    // Đảm bảo menu không vượt quá viewport
    if (menuLeft < 0) {
      menuLeft = 8;
    }
    if (menuLeft + menuMaxWidth > viewportWidth) {
      menuLeft = viewportWidth - menuMaxWidth - 8;
    }
    
    // Đảm bảo menu không vượt quá viewport phía dưới
    const viewportHeight = window.innerHeight;
    const menuHeight = 200;
    if (top + menuHeight > viewportHeight) {
      top = buttonRect.top - menuHeight - menuGap;
    }
    if (top < 0) {
      top = 8;
    }
    
    this.menuPosition = {
      top: top,
      left: menuLeft,
      maxWidth: menuMaxWidth
    };
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.showActionsMenu) {
      this.updateMenuPositionFromButton();
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    if (this.showActionsMenu) {
      this.updateMenuPositionFromButton();
    }
  }

  private updateMenuPositionFromButton() {
    if (!this.showActionsMenu) return;
    
    const container = document.querySelector(`[data-campaign-id="${this.showActionsMenu}"]`) as HTMLElement;
    if (container) {
      const button = container.querySelector('.actions-btn') as HTMLElement;
      if (button) {
        const rect = button.getBoundingClientRect();
        this.updateMenuPosition(rect);
      }
    }
  }

  onDeleteCampaign(campaign: Campaign) {
    // Ngăn double request
    if (this.isDeletingCampaign) return;

    if (confirm(`Xóa chiến dịch "${campaign.name}"?`)) {
      this.isDeletingCampaign = true;
      
      // TODO: Gọi API xóa nếu backend có
      setTimeout(() => {
        this.toaster.success('Chức năng xóa sẽ được cập nhật sau');
        this.showActionsMenu = null;
        this.isDeletingCampaign = false;
      }, 500);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu-container')) {
      this.showActionsMenu = null;
      this.menuPosition = null;
    }
  }

  // Post job
  onPostJob(campaign: Campaign) {
    this.showActionsMenu = null;
    this.menuPosition = null;
    this.router.navigate(['/recruiter/job-posting'], {
      queryParams: { 
        campaignName: campaign.name,
        campaignId: campaign.id 
      }
    });
  }
}