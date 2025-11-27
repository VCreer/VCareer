import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent, ToastNotificationComponent } from '../../../../shared/components';
import { CompanyVerificationViewDto, CompanyVerificationFilterDto, RejectCompanyDto } from 'src/app/proxy/dto/profile/models';
import { CompanyLegalInfoService } from 'src/app/proxy/services/profile/company-legal-info.service';

@Component({
  selector: 'app-company-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, ToastNotificationComponent],
  templateUrl: './company-verify.html',
  styleUrls: ['./company-verify.scss'],
})
export class CompanyVerifyComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;

  companies: CompanyVerificationViewDto[] = [];
  filteredCompanies: CompanyVerificationViewDto[] = [];
  itemsPerPage = 7;
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  selectedCompany: CompanyVerificationViewDto | null = null;
  showRejectModal = false;
  rejectNotes = '';
  isLoading = false;
  searchKeyword = '';
  activeTab: 'pending' | 'verified' = 'pending'; // Tab hiện tại: 'pending' hoặc 'verified'

  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private companyLegalInfoService: CompanyLegalInfoService
  ) {}

  ngOnInit(): void {
    this.initSidebarObserver();
    this.loadCompanies();
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  //#region Sidebar Management

  initSidebarObserver(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
      // Get actual sidebar width (could be 72px collapsed or 280px expanded)
      const computedWidth = window.getComputedStyle(sidebar).width;
      this.sidebarWidth = parseInt(computedWidth) || 72;
    }
  }

  getPageMarginLeft(): string {
    // Always account for sidebar width (72px when collapsed, 280px when expanded)
    return `${this.sidebarWidth}px`;
  }

  getPageWidth(): string {
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getBreadcrumbLeft(): string {
    return `${this.sidebarWidth}px`;
  }

  getBreadcrumbWidth(): string {
    return `calc(100% - ${this.sidebarWidth}px)`;
  }

  getContentMaxWidth(): string {
    return `calc(100% - ${this.sidebarWidth}px - 40px)`;
  }

  getModalPaddingLeft(): string {
    return this.sidebarExpanded ? `${this.sidebarWidth}px` : '0px';
  }

  getModalMaxWidth(): string {
    return this.sidebarExpanded ? `calc(100% - ${this.sidebarWidth}px - 80px)` : 'calc(100% - 80px)';
  }

  //#endregion

  //#region Data Loading

  loadCompanies(): void {
    if (this.activeTab === 'pending') {
      this.loadPendingCompanies();
    } else {
      this.loadVerifiedCompanies();
    }
  }

  loadPendingCompanies(): void {
    this.isLoading = true;
    const filter: CompanyVerificationFilterDto = {
      keyword: this.searchKeyword || undefined,
      skipCount: (this.currentPage - 1) * this.itemsPerPage,
      maxResultCount: this.itemsPerPage,
      sorting: 'CreationTime DESC'
    };

    this.companyLegalInfoService.getPendingCompanies(filter).subscribe({
      next: (result) => {
        this.companies = result.items || [];
        this.totalItems = result.totalCount || 0;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.filteredCompanies = [...this.companies];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending companies:', error);
        this.showErrorToast('Không thể tải danh sách công ty chờ xác thực');
        this.isLoading = false;
      }
    });
  }

  loadVerifiedCompanies(): void {
    this.isLoading = true;
    const filter: CompanyVerificationFilterDto = {
      keyword: this.searchKeyword || undefined,
      skipCount: (this.currentPage - 1) * this.itemsPerPage,
      maxResultCount: this.itemsPerPage,
      sorting: 'LegalReviewedAt DESC'
    };

    this.companyLegalInfoService.getVerifiedCompanies(filter).subscribe({
      next: (result) => {
        this.companies = result.items || [];
        this.totalItems = result.totalCount || 0;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.filteredCompanies = [...this.companies];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading verified companies:', error);
        this.showErrorToast('Không thể tải danh sách công ty đã xác minh');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCompanies();
  }

  onTabChange(tab: 'pending' | 'verified'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.selectedCompany = null;
    this.loadCompanies();
  }

  //#endregion

  //#region Company Selection

  onCompanyClick(company: CompanyVerificationViewDto): void {
    this.selectedCompany = company;
  }

  onCloseDetail(): void {
    this.selectedCompany = null;
  }

  //#endregion

  //#region Approve/Reject

  onApprove(): void {
    if (!this.selectedCompany) return;

    this.isLoading = true;
    this.companyLegalInfoService.approveCompany(this.selectedCompany.id).subscribe({
      next: () => {
        this.showSuccessToast('Đã duyệt công ty thành công');
        this.selectedCompany = null;
        this.loadCompanies(); // Reload current tab
      },
      error: (error) => {
        console.error('Error approving company:', error);
        this.showErrorToast('Duyệt công ty thất bại');
        this.isLoading = false;
      }
    });
  }

  onReject(): void {
    this.showRejectModal = true;
    this.rejectNotes = this.selectedCompany?.rejectionNotes || '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectNotes = '';
  }

  onSubmitReject(): void {
    if (!this.selectedCompany || !this.rejectNotes.trim()) {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
      return;
    }

    this.isLoading = true;
    const rejectDto: RejectCompanyDto = {
      rejectionNotes: this.rejectNotes.trim()
    };

    this.companyLegalInfoService.rejectCompany(this.selectedCompany.id, rejectDto).subscribe({
      next: () => {
        this.showSuccessToast('Đã từ chối công ty thành công');
        this.onCloseRejectModal();
        this.selectedCompany = null;
        this.loadCompanies(); // Reload current tab
      },
      error: (error) => {
        console.error('Error rejecting company:', error);
        this.showErrorToast('Từ chối công ty thất bại');
        this.isLoading = false;
      }
    });
  }

  //#endregion

  //#region Pagination

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCompanies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  //#endregion

  //#region Toast

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  //#endregion

  //#region Utility

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  //#endregion

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdowns if clicking outside
  }
}

