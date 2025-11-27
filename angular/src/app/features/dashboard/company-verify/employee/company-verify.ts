import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent, ToastNotificationComponent } from '../../../../shared/components';
import { CompanyVerificationViewDto, CompanyVerificationFilterDto, RejectCompanyDto } from 'src/app/proxy/dto/profile/models';
import { CompanyLegalInfoService } from 'src/app/proxy/services/profile/company-legal-info.service';
import { environment } from '../../../../../environments/environment';

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
  activeTab: 'pending' | 'verified' | 'rejected' = 'pending'; // Tab hiện tại: 'pending', 'verified', hoặc 'rejected'

  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Image viewer
  showImageModal = false;
  selectedImageUrl: string | null = null;
  selectedImageTitle: string = '';

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
    } else if (this.activeTab === 'verified') {
      this.loadVerifiedCompanies();
    } else if (this.activeTab === 'rejected') {
      this.loadRejectedCompanies();
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

  loadRejectedCompanies(): void {
    this.isLoading = true;
    const filter: CompanyVerificationFilterDto = {
      keyword: this.searchKeyword || undefined,
      skipCount: (this.currentPage - 1) * this.itemsPerPage,
      maxResultCount: this.itemsPerPage,
      sorting: 'LegalReviewedAt DESC'
    };

    this.companyLegalInfoService.getRejectedCompanies(filter).subscribe({
      next: (result) => {
        this.companies = result.items || [];
        this.totalItems = result.totalCount || 0;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.filteredCompanies = [...this.companies];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading rejected companies:', error);
        this.showErrorToast('Không thể tải danh sách công ty đã bị từ chối');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCompanies();
  }

  onTabChange(tab: 'pending' | 'verified' | 'rejected'): void {
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

  /**
   * Resolve file URL - convert storage path to full URL
   */
  resolveFileUrl(path?: string | null): string | null {
    if (!path) {
      return null;
    }

    // Nếu backend đã trả về full URL thì dùng luôn
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Mặc định: gọi qua API download để stream file từ storage
    const apiBase = environment.apis.default.url;
    const encodedPath = encodeURIComponent(path);
    return `${apiBase}/api/profile/company-legal-info/legal-document?storagePath=${encodedPath}`;
  }

  /**
   * Check if file is an image based on extension
   */
  isImageFile(fileUrl?: string | null): boolean {
    if (!fileUrl) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUrl = fileUrl.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Check if file is a PDF
   */
  isPdfFile(fileUrl?: string | null): boolean {
    if (!fileUrl) return false;
    return fileUrl.toLowerCase().includes('.pdf');
  }

  /**
   * Get file name from URL
   */
  getFileName(fileUrl?: string | null): string {
    if (!fileUrl) return '';
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      const fileName = pathname.split('/').pop() || '';
      return fileName || 'Tài liệu';
    } catch {
      // If not a valid URL, try to extract from path
      const parts = fileUrl.split('/');
      return parts[parts.length - 1] || 'Tài liệu';
    }
  }

  /**
   * Open image in modal for full size view
   */
  openImageModal(imageUrl: string | null, title: string): void {
    if (!imageUrl) return;
    this.selectedImageUrl = this.resolveFileUrl(imageUrl);
    this.selectedImageTitle = title;
    this.showImageModal = true;
  }

  /**
   * Close image modal
   */
  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImageUrl = null;
    this.selectedImageTitle = '';
  }

  //#endregion

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdowns if clicking outside
  }
}

