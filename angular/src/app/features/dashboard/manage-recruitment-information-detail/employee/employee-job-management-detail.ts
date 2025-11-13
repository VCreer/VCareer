import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastNotificationComponent } from '../../../../shared/components';

@Component({
  selector: 'app-employee-job-management-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent],
  templateUrl: './employee-job-management-detail.html',
  styleUrls: ['./employee-job-management-detail.scss'],
})
export class EmployeeJobManagementDetailComponent implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarWidth = 0;
  private sidebarCheckInterval?: any;
  
  // Reject modal properties
  showRejectModal = false;
  rejectReason = '';
  
  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  jobId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
    
    // Get job ID from query params
    this.route.queryParams.subscribe(params => {
      this.jobId = params['id'] || null;
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
    } else {
      this.sidebarWidth = 0;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkSidebarState();
  }

  getModalPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getModalMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return 'calc(100% - 40px)';
    }
    const overlayPadding = 40;
    const availableWidth = viewportWidth - this.sidebarWidth - overlayPadding;
    return `${Math.min(500, availableWidth)}px`;
  }

  onApprove(): void {
    // TODO: Implement approve logic with API call
    this.showSuccessToast('Đã duyệt tin tuyển dụng thành công');
    // Navigate back after a short delay
    setTimeout(() => {
      this.router.navigate(['/employee/manage-recruitment-information']);
    }, 1500);
  }

  onReject(): void {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  onSubmitReject(): void {
    if (this.rejectReason.trim()) {
      // TODO: Implement reject logic with API call
      this.showSuccessToast('Đã từ chối tin tuyển dụng thành công');
      this.onCloseRejectModal();
      // Navigate back after a short delay
      setTimeout(() => {
        this.router.navigate(['/employee/manage-recruitment-information']);
      }, 1500);
    } else {
      this.showErrorToast('Vui lòng nhập lý do từ chối');
    }
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onBack(): void {
    this.router.navigate(['/employee/manage-recruitment-information']);
  }

  getCompanyLogoUrl(companyName: string): string {
    // Try to get logo image, fallback to placeholder
    const logoMap: { [key: string]: string } = {
      'airCloset': 'assets/images/companies/aircloset.png',
      'FOXAi': 'assets/images/companies/foxai.png',
      'LIFESTYLE': 'assets/images/companies/lifestyle.png',
      'Jarvis': 'assets/images/companies/jarvis.png',
    };
    
    // Check if company name contains any logo key
    for (const [key, url] of Object.entries(logoMap)) {
      if (companyName.toUpperCase().includes(key.toUpperCase())) {
        return url;
      }
    }
    
    // Generate SVG with first letter as fallback
    const firstLetter = companyName.charAt(0).toUpperCase();
    const svg = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#F3F4F6" rx="8"/><text x="50%" y="50%" font-size="24" font-weight="700" fill="#6B7280" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif">${firstLetter}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}

