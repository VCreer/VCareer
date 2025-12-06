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
    { value: 'interview', label: 'Hẹn phỏng vấn' },
    { value: 'offer', label: 'Gửi đề nghị' },
    { value: 'hired', label: 'Nhận việc' },
    { value: 'not-suitable', label: 'Chưa phù hợp' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private candidateCvService: CandidateCvService,
    private uploadedCvService: UploadedCvService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
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
    
    this.applicationService.getApplication(this.applicationId).subscribe({
      next: (application: ApplicationDto) => {
        this.application = application;
        this.isViewed = !!application.viewedAt;
        
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
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.loading = false;
        this.showToastMessage('Không thể tải thông tin ứng viên', 'error');
      }
    });
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
        this.showToastMessage('Không thể tải CV online', 'error');
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
        this.showToastMessage('Không thể tải CV đã upload', 'error');
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
    if (!this.application) {
      this.showToastMessage('Không có thông tin CV', 'error');
      return;
    }

    this.showToastMessage('Đang tải CV PDF...', 'info');

    if (this.cvType === 'online' && this.application.candidateCvId) {
      // TODO: Implement PDF generation for online CV
      // For now, open in new window
      const printWindow = window.open('', '_blank');
      if (printWindow && this.cvHtml) {
        printWindow.document.write(this.cvHtml);
        printWindow.document.close();
        printWindow.print();
      }
      this.showToastMessage('Đang mở CV để in...', 'info');
    } else if (this.cvType === 'uploaded' && this.application.uploadedCvId) {
      const downloadUrl = `${environment.apis.default.url}/api/cv/uploaded/${this.application.uploadedCvId}/download?inline=false`;
      
      this.http.get(downloadUrl, {
        responseType: 'blob',
        withCredentials: true
      }).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.application?.uploadedCvName || 'CV.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.showToastMessage('Tải CV PDF thành công!', 'success');
        },
        error: (error) => {
          console.error('Error downloading CV:', error);
          this.showToastMessage('Không thể tải CV PDF', 'error');
        }
      });
    }
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
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.changingStatus = true;

    const updateDto: UpdateApplicationStatusDto = {
      status: status,
      recruiterNotes: ''
    };

    this.applicationService.updateApplicationStatus(this.applicationId, updateDto).subscribe({
      next: (updatedApplication: ApplicationDto) => {
        this.application = updatedApplication;
        if (this.cvDetail) {
          this.cvDetail.status = updatedApplication.status || 'received';
        }
        this.changingStatus = false;
        this.showToastMessage(`Đã cập nhật trạng thái thành "${this.getStatusLabel(status)}"`, 'success');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.selectedStatus = oldStatus;
        this.changingStatus = false;
        this.showToastMessage('Không thể cập nhật trạng thái', 'error');
      }
    });
  }

  getStatusLabel(value: string): string {
    const status = this.statusOptions.find(s => s.value === value);
    return status ? status.label : 'CV tiếp nhận';
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

