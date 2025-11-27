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

  // DÙNG DUY NHẤT 1 API: loadRecruitmentCompainByIsActive
  private loadCampaigns() {
    this.loading = true;

    const loadActive = this.campaignService.loadRecruitmentCompainByIsActive(true).toPromise().catch(() => []);
    const loadInactive = this.campaignService.loadRecruitmentCompainByIsActive(false).toPromise().catch(() => []);

    Promise.all([loadActive, loadInactive]).then(([active, inactive]) => {
      const all = [...(active || []), ...(inactive || [])];
      this.campaigns = this.mapToCampaign(all);
      this.filterCampaigns();
      this.viewMode = this.campaigns.length == 0 ? 'create' : 'manage';
      this.loading = false;
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
    this.showActionsMenu = this.showActionsMenu === campaignId ? null : campaignId;
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
    }
  }

  // Post job
  onPostJob(campaign: Campaign) {
    this.showActionsMenu = null;
    this.router.navigate(['/recruiter/job-posting'], {
      queryParams: { 
        campaignName: campaign.name,
        campaignId: campaign.id 
      }
    });
  }
}