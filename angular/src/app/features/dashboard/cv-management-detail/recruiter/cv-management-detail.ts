import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import {
  ButtonComponent,
  ToastNotificationComponent
} from '../../../../shared/components';
import { ApplicationService } from '../../../../proxy/http-api/controllers/application.service';
import { CandidateCvService } from '../../../../proxy/http-api/controllers/candidate-cv.service';
import { UploadedCvService } from '../../../../proxy/http-api/controllers/uploaded-cv.service';
import type { ApplicationDto,UpdateApplicationStatusDto } from 'src/app/proxy/dto/applications';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

export interface CvDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: string;
  campaignName?: string;
  contactOpenedDate?: string;
}

export interface Education {
  degree: string;
  school: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}

export interface HonorAward {
  year: string;
  title: string;
}

export interface Certificate {
  year: string;
  title: string;
}

export interface Activity {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface PersonalInfo {
  phone: string;
  email: string;
  facebook?: string;
  address?: string;
}

export interface Skill {
  category: string;
  items: string[];
}

@Component({
  selector: 'app-cv-management-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './cv-management-detail.html',
  styleUrls: ['./cv-management-detail.scss']
})
export class CvManagementDetailComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;

  applicationId: string = '';
  application: ApplicationDto | null = null;
  cvDetail: CvDetail | null = null;
  loading = false;
  returnUrl: string | null = null;
  isViewed: boolean = false;

  // CV Display
  pdfUrl: SafeResourceUrl | null = null;
  cvHtml: string = '';
  safeCvHtml: SafeHtml | null = null;
  cvType: 'online' | 'uploaded' | null = null;
  
  // Access Control
  hasAccess: boolean = true;
  accessDenied: boolean = false;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Status dropdown
  selectedStatus: string = 'received';
  showStatusDropdown: boolean = false;
  changingStatus: boolean = false;

  statusOptions = [
    { value: 'received', label: 'CV tiếp nhận' },
    { value: 'suitable', label: 'Phù hợp' },
    { value: 'offer', label: 'Gửi đề nghị' },
    { value: 'not-suitable', label: 'Chưa phù hợp' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private candidateCvService: CandidateCvService,
    private uploadedCvService: UploadedCvService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Get Application ID and return URL from route
    this.route.queryParams.subscribe(params => {
      this.applicationId = params['cvId'] || params['applicationId'] || '';
      this.returnUrl = params['returnUrl'] || null;
      if (this.applicationId) {
        this.loadApplicationDetail();
      }
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
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  loadApplicationDetail(): void {
    this.loading = true;
    this.hasAccess = true;
    this.accessDenied = false;
    
    this.applicationService.getApplication(this.applicationId).subscribe({
      next: (application: ApplicationDto) => {
        this.application = application;
        this.isViewed = !!application.viewedAt;
        
        // Check if we have access to view this candidate's CV
        // This will be handled by backend, but we also check on frontend
        this.checkCandidateAccess(application.candidateId).then(hasAccess => {
          if (!hasAccess) {
            this.hasAccess = false;
            this.accessDenied = true;
            this.loading = false;
            return;
          }
          
          // Mark as viewed if not viewed yet
          if (!this.isViewed) {
            this.markAsViewed();
          }
          
          // Map ApplicationDto to CvDetail
          this.cvDetail = {
            id: application.id || '',
            name: application.candidateName || 'N/A',
            email: application.candidateEmail || 'N/A',
            phone: application.candidatePhone || 'N/A',
            position: application.jobTitle || 'N/A',
            status: application.status || 'received',
            campaignName: application.jobTitle || '',
            contactOpenedDate: application.viewedAt ? new Date(application.viewedAt).toLocaleDateString('vi-VN') : undefined
          };
          
          this.selectedStatus = application.status || 'received';
          
          // Determine CV type and load CV
          if (application.cvType === 'Online' && application.candidateCvId) {
            this.cvType = 'online';
            this.loadOnlineCv(application.candidateCvId);
          } else if (application.cvType === 'Uploaded' && application.uploadedCvId) {
            this.cvType = 'uploaded';
            this.loadUploadedCv(application.uploadedCvId);
          } else {
            this.loading = false;
            this.showToastMessage('Không tìm thấy CV', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.loading = false;
        
        // Check if error is due to access denied (403 or specific error message)
        if (error.status === 403 || error.status === 401 || 
            (error.error && (error.error.message?.includes('visibility') || error.error.message?.includes('access')))) {
          this.hasAccess = false;
          this.accessDenied = true;
        } else {
          this.showToastMessage('Không thể tải thông tin ứng viên', 'error');
        }
      }
    });
  }
  
  private async checkCandidateAccess(candidateId?: string): Promise<boolean> {
    if (!candidateId) {
      return false;
    }
    
    try {
      // Try to load CV to check access - if it fails with 403, access is denied
      // For now, we'll assume access is granted if application was loaded
      // Backend should handle the actual check
      return true;
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        return false;
      }
      return true; // Other errors don't necessarily mean access denied
    }
  }

  loadOnlineCv(cvId: string): void {
    this.candidateCvService.renderCv(cvId).subscribe({
      next: (response: any) => {
        // Extract htmlContent từ ActionResult - kiểm tra nhiều cấu trúc response có thể
        let htmlContent = '';
        
        // Log để debug
        console.log('Render CV Response:', response);
        
        // Thử các cấu trúc response khác nhau
        if (response.htmlContent) {
          htmlContent = response.htmlContent;
        } else if (response.result?.htmlContent) {
          htmlContent = response.result.htmlContent;
        } else if (response.value?.htmlContent) {
          htmlContent = response.value.htmlContent;
        } else if (response.data?.htmlContent) {
          htmlContent = response.data.htmlContent;
        } else if (typeof response.value === 'string') {
          htmlContent = response.value;
        } else if (typeof response.result === 'string') {
          htmlContent = response.result;
        }
        
        if (htmlContent) {
          this.cvHtml = htmlContent;
          // Sử dụng DomSanitizer để cho phép render HTML/CSS
          this.safeCvHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
          this.loading = false;
        } else {
          console.error('Rendered CV HTML is empty. Response structure:', response);
          this.loading = false;
          this.showToastMessage('Không thể render CV online', 'error');
        }
      },
      error: (error) => {
        console.error('Error loading online CV:', error);
        this.loading = false;
        
        // Check if error is due to access denied
        if (error.status === 403 || error.status === 401 || 
            (error.error && (error.error.message?.includes('visibility') || error.error.message?.includes('access') || error.error.message?.includes('ProfileVisibility')))) {
          this.hasAccess = false;
          this.accessDenied = true;
        } else {
          this.showToastMessage('Không thể tải CV online', 'error');
        }
      }
    });
  }

  loadUploadedCv(cvId: string): void {
    const downloadUrl = `${environment.apis.default.url}/api/cv/uploaded/${cvId}/download?inline=true`;
    
    this.http.get(downloadUrl, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#toolbar=0&navpanes=0&scrollbar=0');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading uploaded CV:', error);
        this.loading = false;
        
        // Check if error is due to access denied
        if (error.status === 403 || error.status === 401) {
          this.hasAccess = false;
          this.accessDenied = true;
        } else {
          this.showToastMessage('Không thể tải CV đã upload', 'error');
        }
      }
    });
  }

  markAsViewed(): void {
    if (!this.applicationId) {
      return;
    }

    this.applicationService.markAsViewed(this.applicationId).subscribe({
      next: (application: ApplicationDto) => {
        this.application = application;
        this.isViewed = true;
        if (this.cvDetail) {
          this.cvDetail.contactOpenedDate = application.viewedAt 
            ? new Date(application.viewedAt).toLocaleDateString('vi-VN') 
            : undefined;
        }
      },
      error: (error) => {
        console.error('Error marking as viewed:', error);
        // Don't show error toast, just log it
      }
    });
  }

  onClose(): void {
    // Navigate back to return URL if provided, otherwise default to cv-management
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/recruiter/cv-management']);
    }
  }

  onDownloadPdf(): void {
    if (!this.application || !this.applicationId) {
      this.showToastMessage('Không có thông tin CV', 'error');
      return;
    }

    this.showToastMessage('Đang tải CV PDF...', 'info');

    // Sử dụng fetch trực tiếp để download file PDF từ application endpoint
    fetch(`${environment.apis.default.url}/api/applications/${this.applicationId}/download-cv`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/pdf, application/octet-stream, */*',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Không thể tải CV. Vui lòng thử lại.';
          
          try {
            const error = JSON.parse(errorText);
            errorMessage = error.error?.message || error.message || errorMessage;
          } catch {
            errorMessage = `Lỗi ${response.status}: ${errorText || 'Không thể tải CV'}`;
          }
          
          this.showToastMessage(errorMessage, 'error');
          return;
        }
        
        // Kiểm tra content-type để đảm bảo là PDF
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorText = await response.text();
          try {
            const error = JSON.parse(errorText);
            this.showToastMessage(error.error?.message || error.message || 'Không thể tải CV.', 'error');
          } catch {
            this.showToastMessage('Không thể tải CV. Vui lòng thử lại.', 'error');
          }
          return;
        }
        
        // Lấy blob từ response
        const blob = await response.blob();
        
        // Tạo URL từ blob và trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Tạo tên file an toàn (loại bỏ ký tự đặc biệt)
        const candidateName = this.cvDetail?.name || this.application.candidateName || 'CV';
        const safeName = candidateName.replace(/[^a-zA-Z0-9\s]/g, '_').trim();
        link.download = `CV_${safeName}_${this.applicationId.substring(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.showToastMessage(`Đã tải CV của ${candidateName} thành công!`, 'success');
      })
      .catch((error) => {
        console.error('Error downloading CV:', error);
        this.showToastMessage('Không thể tải CV. Vui lòng thử lại.', 'error');
      });
  }

  onContact(contactType: 'phone' | 'email' | 'chat'): void {
    // TODO: Implement contact functionality
    const contactLabels = {
      phone: 'Gọi điện',
      email: 'Gửi email',
      chat: 'Nhắn tin'
    };
    this.showToastMessage(`Đang mở ${contactLabels[contactType]}...`, 'info');
  }

  toggleStatusDropdown(): void {
    if (this.cvDetail) {
      this.showStatusDropdown = !this.showStatusDropdown;
    }
  }

  onStatusSelect(status: string): void {
    if (!this.application || this.changingStatus) return;
    
    const oldStatus = this.selectedStatus;

    // Don't update if status hasn't changed
    if (oldStatus === status) {
      this.showStatusDropdown = false;
      return;
    }

    console.log(`Changing status from ${oldStatus} to ${status}`);

    // Optimistic update - update UI immediately
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.changingStatus = true;

    if (this.cvDetail) {
      this.cvDetail.status = status;
    }

    const updateDto: UpdateApplicationStatusDto = {
      status: status,
      recruiterNotes: this.application.recruiterNotes || '',
      rating: this.application.rating
    };

    this.applicationService.updateApplicationStatus(this.applicationId, updateDto).subscribe({
      next: (updatedApplication: ApplicationDto) => {
        this.application = updatedApplication;
        if (this.cvDetail) {
          this.cvDetail.status = updatedApplication.status || 'received';
        }
        this.changingStatus = false;
        this.showToastMessage(
          `Đã cập nhật trạng thái thành "${this.getStatusLabel(status)}"`,
          'success'
        );

        // Send notification to candidate when status changes to 'offer'
        if (status === 'offer' && this.application.candidateId) {
          console.log('[CV Detail] Status changed to offer, preparing to send notification');
          this.sendOfferNotification();
        }
      },
      error: (error) => {
        console.error('Error updating status:', error);
        console.error('Error status:', error.status);

        let errorMessage = 'Không thể cập nhật trạng thái. Vui lòng thử lại.';

        if (error.status === 403) {
          errorMessage = 'Bạn không có quyền cập nhật trạng thái ứng viên này.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        }

        this.showToastMessage(errorMessage, 'error');
        this.changingStatus = false;

        // Revert to previous status on error
        this.selectedStatus = oldStatus;
        if (this.cvDetail) {
          this.cvDetail.status = oldStatus;
        }
      }
    });
  }

  getStatusLabel(value: string): string {
    const status = this.statusOptions.find(s => s.value === value);
    return status ? status.label : 'CV tiếp nhận';
  }

  getStatusName(status: string): string {
    return this.getStatusLabel(status);
  }

  private sendOfferNotification(): void {
    if (!this.application?.candidateId) {
      console.warn('[CV Detail] Cannot send notification: candidateId is missing');
      return;
    }

    // Validate and convert candidateId to Guid
    let candidateGuid: string;
    try {
      candidateGuid = this.application.candidateId;
      // Validate Guid format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateGuid)) {
        console.error('[CV Detail] Invalid candidateId format (not a Guid):', this.application.candidateId);
        return;
      }
    } catch (error) {
      console.error('[CV Detail] Error parsing candidateId:', error);
      return;
    }

    // Prepare notification metadata
    const metadata = {
      JobTitle: this.application.jobTitle || 'Công việc',
      CompanyName: '', // TODO: Get company name from current user context
      JobId: this.application.jobId || '',
      ApplicationId: this.application.id || '',
    };

    // Convert jobId to Guid if provided, otherwise null
    let relatedEntityId: string | null = null;
    if (this.application.jobId) {
      try {
        // Validate Guid format
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.application.jobId)) {
          relatedEntityId = this.application.jobId;
        } else {
          console.warn('[CV Detail] Invalid jobId format (not a Guid):', this.application.jobId);
        }
      } catch (error) {
        console.warn('[CV Detail] Error parsing jobId:', error);
      }
    }

    const notification = {
      userId: candidateGuid,
      userRole: 'Candidate',
      notificationType: 'JobOffer',
      title: 'Đề nghị công việc',
      message: '',
      relatedEntityType: 'JobPost',
      relatedEntityId: relatedEntityId,
      metadata: JSON.stringify(metadata),
    };

    console.log('[CV Detail] Sending offer notification:', notification);

    this.notificationService.createNotification(notification).subscribe({
      next: () => {
        console.log('[CV Detail] Offer notification sent successfully');
      },
      error: (error) => {
        console.error('[CV Detail] Error sending offer notification:', error);
        // Don't show error toast to user, just log it
      },
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showStatusDropdown) {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown-wrapper')) {
        this.showStatusDropdown = false;
      }
    }
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }
}

