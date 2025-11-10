import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../../core/services/translation.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { CvListComponent } from '../../../../shared/components/cv-list/cv-list';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ProfilePictureEditModal } from '../../../../shared/components/profile-picture-edit-modal/profile-picture-edit-modal';
import { UploadCvModal } from '../../../../shared/components/upload-cv-modal/upload-cv-modal';
import { DownloadCvModal } from '../../../../shared/components/download-cv-modal/download-cv-modal';
import { RenameCvModal } from '../../../../shared/components/rename-cv-modal/rename-cv-modal';
import { UploadedCvCard } from '../../../../shared/components/uploaded-cv-card/uploaded-cv-card';
import { CandidateCvService } from '../../../../proxy/http-api/controllers/candidate-cv.service';
import { CandidateCvDto, GetCandidateCvListDto } from '../../../../proxy/cv/models';
import { UploadedCvService } from '../../../../proxy/http-api/controllers/uploaded-cv.service';
import { UploadedCvDto, GetUploadedCvListDto } from '../../../../proxy/application/contracts/cv/models';

// Interface để map dữ liệu cho UI - ĐẶT TRƯỚC Component decorator
export interface CvDisplayItem {
  id: string;
  title: string;
  preview: string;
  isDefault: boolean;
  updatedAt: string;
  version?: string;
  cvData?: CandidateCvDto;
}

@Component({
  selector: 'app-cv-management',
  standalone: true,
  imports: [
    CommonModule,
    ToastNotificationComponent,
    CvListComponent,
    ButtonComponent,
    ProfilePictureEditModal,
    UploadCvModal,
    DownloadCvModal,
    RenameCvModal,
    UploadedCvCard
  ],
  templateUrl: './cv-management.html',
  styleUrls: ['./cv-management.scss']
})
export class CvManagementComponent implements OnInit {
  selectedLanguage = 'vi';
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  cvs: CvDisplayItem[] = [];
  loading = false;
  showProfilePictureModal = false;
  showUploadCvModal = false;
  showDownloadModal = false;
  showRenameModal = false;
  cvToRename: any = null;
  uploadedCvs: UploadedCvDto[] = [];
  loadingUploadedCvs = false;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private candidateCvService: CandidateCvService,
    private uploadedCvService: UploadedCvService,
    @Inject(HttpClient) private http: HttpClient
  ) {}

  ngOnInit() {
    console.log('CvManagementComponent ngOnInit called');
    console.log('CandidateCvService:', this.candidateCvService);
    
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
    
    // Load CVs
    console.log('Calling loadCvs()...');
    this.loadCvs();
    
    // Load uploaded CVs
    this.loadUploadedCvs();
  }

  loadCvs() {
    console.log('loadCvs() called');
    this.loading = true;
    
    // Tạo input để lấy danh sách CV của user hiện tại
    const input: GetCandidateCvListDto = {
      skipCount: 0,
      maxResultCount: 100,
      sorting: 'creationTime DESC'
    };

    console.log('Calling candidateCvService.getList with input:', input);
    console.log('Service instance:', this.candidateCvService);
    
    const subscription = this.candidateCvService.getList(input).subscribe({
      next: (response: any) => {
        console.log('CV List Response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // Extract data từ ActionResult hoặc PagedResultDto
        // Response có thể là:
        // 1. ActionResult<PagedResultDto<CandidateCvDto>> với result.items
        // 2. ActionResult với result là array
        // 3. PagedResultDto với items
        // 4. Array trực tiếp
        let cvList: CandidateCvDto[] = [];
        
        // Case 1: ActionResult với result là PagedResultDto
        if (response.result?.items && Array.isArray(response.result.items)) {
          cvList = response.result.items;
        }
        // Case 2: ActionResult với result là array
        else if (response.result && Array.isArray(response.result)) {
          cvList = response.result;
        }
        // Case 3: PagedResultDto trực tiếp
        else if (response.items && Array.isArray(response.items)) {
          cvList = response.items;
        }
        // Case 4: Array trực tiếp
        else if (Array.isArray(response)) {
          cvList = response;
        }
        // Case 5: ActionResult với value
        else if (response.value?.items && Array.isArray(response.value.items)) {
          cvList = response.value.items;
        }
        else if (response.value && Array.isArray(response.value)) {
          cvList = response.value;
        }
        // Case 6: Data property
        else if (response.data?.items && Array.isArray(response.data.items)) {
          cvList = response.data.items;
        }
        else if (response.data && Array.isArray(response.data)) {
          cvList = response.data;
        }
        
        console.log('Extracted CV List:', cvList);
        
        // Map CandidateCvDto sang CvDisplayItem
        this.cvs = cvList.map(cv => this.mapCvToDisplayItem(cv));
        this.loading = false;
        
        if (this.cvs.length === 0) {
          console.log('No CVs found. User may need to create a CV first.');
        }
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        this.showToastMessage(this.translate('cv_management.load_error') || 'Lỗi khi tải danh sách CV', 'error');
        this.loading = false;
      }
    });
    
    // Log subscription để debug
    console.log('Subscription created:', subscription);
  }

  /**
   * Map CandidateCvDto sang CvDisplayItem để hiển thị
   */
  private mapCvToDisplayItem(cv: CandidateCvDto): CvDisplayItem {
    // Lấy preview image từ template
    // Nếu không có previewImageUrl, tạo placeholder hoặc dùng default
    let previewImage = cv.template?.previewImageUrl;
    
    if (!previewImage || previewImage.trim() === '') {
      // Nếu không có preview image, tạo data URL từ CV render để làm thumbnail
      // Hoặc dùng placeholder mặc định
      previewImage = this.generatePreviewPlaceholder(cv);
    }

    // Format updated date - ưu tiên publishedAt, sau đó dùng creationTime
    let updatedAt = '';
    if (cv.publishedAt) {
      updatedAt = new Date(cv.publishedAt).toLocaleDateString('vi-VN');
    } else {
      // Fallback to current date formatted
      updatedAt = new Date().toLocaleDateString('vi-VN');
    }

    return {
      id: cv.id || '',
      title: cv.cvName || 'CV chưa có tên',
      preview: previewImage,
      isDefault: cv.isDefault || false,
      updatedAt: updatedAt,
      version: cv.template?.version || '1.0',
      cvData: cv
    };
  }

  /**
   * Generate preview placeholder khi không có preview image
   */
  private generatePreviewPlaceholder(cv: CandidateCvDto): string {
    // Tạo placeholder dựa trên template name hoặc CV name
    const templateName = cv.template?.name || 'CV';
    const cvName = cv.cvName || 'CV';
    
    // Có thể tạo một SVG placeholder hoặc dùng image mặc định
    // Hoặc có thể render CV thành thumbnail (nhưng tốn performance)
    
    // Tạm thời dùng placeholder image
    return 'assets/images/cv-management/cv-preview-placeholder.png';
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onCreateCv() {
    // Navigate to CV template selection page
    this.router.navigate(['/candidate/cv-sample']);
  }

  onCloseUploadCvModal() {
    this.showUploadCvModal = false;
  }

  loadUploadedCvs() {
    this.loadingUploadedCvs = true;
    const input: GetUploadedCvListDto = {
      skipCount: 0,
      maxResultCount: 100,
      sorting: 'creationTime DESC'
    };

    this.uploadedCvService.getList(input).subscribe({
      next: (response: any) => {
        console.log('Uploaded CV List Response:', response);
        
        // Extract data từ ActionResult
        let cvList: UploadedCvDto[] = [];
        
        if (response.result?.items && Array.isArray(response.result.items)) {
          cvList = response.result.items;
        } else if (response.result && Array.isArray(response.result)) {
          cvList = response.result;
        } else if (response.items && Array.isArray(response.items)) {
          cvList = response.items;
        } else if (Array.isArray(response)) {
          cvList = response;
        } else if (response.value?.items && Array.isArray(response.value.items)) {
          cvList = response.value.items;
        } else if (response.value && Array.isArray(response.value)) {
          cvList = response.value;
        }
        
        this.uploadedCvs = cvList;
        this.loadingUploadedCvs = false;
      },
      error: (error) => {
        console.error('Error loading uploaded CVs:', error);
        this.showToastMessage(this.translate('cv_management.load_uploaded_error') || 'Lỗi khi tải danh sách CV đã tải lên', 'error');
        this.loadingUploadedCvs = false;
      }
    });
  }

  onUploadCv(file: File) {
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cvName', file.name);
    formData.append('isDefault', 'false');
    formData.append('isPublic', 'false');
    
    // Use HttpClient directly for file upload with FormData
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const headers: any = {
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    this.http.post<any>('https://localhost:44385/api/cv/uploaded/upload', formData, { headers }).subscribe({
      next: (response: any) => {
        console.log('Upload CV Response:', response);
        // Extract result from ActionResult if needed
        const uploadedCv = response.result || response.value || response;
        this.showToastMessage(this.translate('upload_cv.upload_success') || 'Tải lên CV thành công', 'success');
        this.showUploadCvModal = false;
        this.loadUploadedCvs(); // Reload list
      },
      error: (error) => {
        console.error('Error uploading CV:', error);
        const errorMessage = error.error?.message || error.message || 'Tải lên CV thất bại';
        this.showToastMessage(errorMessage, 'error');
      }
    });
  }

  viewCv(cvId: string) {
    // Navigate đến trang view CV (không dùng popup)
    this.router.navigate(['/candidate/cv-management/view', cvId]);
  }

  editCv(cvId: string) {
    this.router.navigate(['/candidate/cv-management/edit', cvId]);
  }

  onCvUpdated(cvId: string) {
    this.showToastMessage(this.translate('cv_management.updated_successfully'), 'success');
    this.loadCvs();
  }

  onCvDeleted(cvId: string) {
    this.candidateCvService.delete(cvId).subscribe({
      next: () => {
        this.showToastMessage(this.translate('cv_management.deleted_successfully') || 'Xóa CV thành công', 'success');
        this.loadCvs();
      },
      error: (error) => {
        console.error('Error deleting CV:', error);
        this.showToastMessage(this.translate('cv_management.delete_failed') || 'Xóa CV thất bại', 'error');
      }
    });
  }

  onCvDuplicated(cvId: string) {
    // Lấy CV hiện tại
    this.candidateCvService.get(cvId).subscribe({
      next: (response: any) => {
        // Extract CV từ ActionResult
        let cv: CandidateCvDto;
        if (response.result) {
          cv = response.result;
        } else if (response.data) {
          cv = response.data;
        } else {
          cv = response;
        }
        
        if (!cv || !cv.id || !cv.templateId) {
          this.showToastMessage(this.translate('cv_management.duplicate_failed') || 'Không thể sao chép CV', 'error');
          return;
        }

        // Tạo CV mới với dữ liệu tương tự
        const duplicateDto = {
          templateId: cv.templateId,
          cvName: `${cv.cvName} (Bản sao)`,
          dataJson: cv.dataJson || '{}',
          isPublished: false,
          isDefault: false,
          isPublic: false,
          notes: cv.notes || ''
        };

        this.candidateCvService.create(duplicateDto).subscribe({
          next: () => {
            this.showToastMessage(this.translate('cv_management.duplicated_successfully') || 'Sao chép CV thành công', 'success');
            this.loadCvs();
          },
          error: (error) => {
            console.error('Error duplicating CV:', error);
            this.showToastMessage(this.translate('cv_management.duplicate_failed') || 'Sao chép CV thất bại', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error getting CV to duplicate:', error);
        this.showToastMessage(this.translate('cv_management.duplicate_failed') || 'Sao chép CV thất bại', 'error');
      }
    });
  }

  onSetDefault(cvId: string) {
    this.candidateCvService.setDefault(cvId).subscribe({
      next: () => {
        this.showToastMessage(this.translate('cv_management.set_default_successfully') || 'Đặt CV mặc định thành công', 'success');
        this.loadCvs();
      },
      error: (error) => {
        console.error('Error setting default CV:', error);
        this.showToastMessage(this.translate('cv_management.set_default_failed') || 'Đặt CV mặc định thất bại', 'error');
      }
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose() {
    this.showToast = false;
  }

  // Profile Picture Modal methods
  openProfilePictureModal() {
    this.showProfilePictureModal = true;
  }

  closeProfilePictureModal() {
    this.showProfilePictureModal = false;
  }

  onProfilePictureChange() {
    this.showToastMessage(this.translate('profile_picture_edit.change_success'), 'success');
    this.closeProfilePictureModal();
  }

  onProfilePictureDelete() {
    this.showToastMessage(this.translate('profile_picture_edit.delete_success'), 'success');
    this.closeProfilePictureModal();
  }

  // CV Card methods for uploaded CVs
  onUploadedCvDownload(cv: UploadedCvDto) {
    if (!cv.id) {
      this.showToastMessage('CV ID không hợp lệ', 'error');
      return;
    }

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      this.showToastMessage('Vui lòng đăng nhập lại', 'error');
      return;
    }

    // Download file với token authentication
    const downloadUrl = `https://localhost:44385/api/cv/uploaded/${cv.id}/download?inline=false`;
    
    this.http.get(downloadUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (blob: Blob) => {
        // Tạo blob URL và download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = cv.cvName || cv.originalFileName || 'cv.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup blob URL
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        this.showToastMessage('Đang tải CV...', 'info');
      },
      error: (error) => {
        console.error('Error downloading CV:', error);
        this.showToastMessage('Tải CV thất bại', 'error');
      }
    });
  }

  onUploadedCvToggleStar(cv: UploadedCvDto) {
    if (!cv.id) return;
    
    this.uploadedCvService.setDefault(cv.id).subscribe({
      next: () => {
        cv.isDefault = !cv.isDefault;
        this.showToastMessage(cv.isDefault ? 'Đặt CV mặc định thành công' : 'Bỏ CV mặc định thành công', 'success');
        this.loadUploadedCvs(); // Reload to update all CVs
      },
      error: (error) => {
        console.error('Error setting default CV:', error);
        this.showToastMessage('Thao tác thất bại', 'error');
      }
    });
  }

  onUploadedCvView(cv: UploadedCvDto) {
    // Mở PDF trong tab mới giống như mở file trực tiếp trên máy
    if (!cv.id) {
      return;
    }

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      this.showToastMessage('Vui lòng đăng nhập lại', 'error');
      return;
    }

    // Download PDF với token authentication, sau đó mở blob URL trong tab mới
    const downloadUrl = `https://localhost:44385/api/cv/uploaded/${cv.id}/download?inline=true`;
    
    this.http.get(downloadUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (blob: Blob) => {
        // Tạo blob URL từ response
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Mở blob URL trong tab mới - browser sẽ tự động hiển thị PDF viewer
        const newWindow = window.open(blobUrl, '_blank');
        
        if (!newWindow) {
          this.showToastMessage('Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.', 'error');
          // Cleanup blob URL nếu không mở được
          window.URL.revokeObjectURL(blobUrl);
        } else {
          // Cleanup blob URL sau khi window đóng (optional, browser sẽ tự cleanup khi tab đóng)
          newWindow.addEventListener('beforeunload', () => {
            window.URL.revokeObjectURL(blobUrl);
          });
        }
      },
      error: (error) => {
        console.error('Error loading PDF:', error);
        this.showToastMessage('Không thể tải CV. Vui lòng thử lại.', 'error');
      }
    });
  }

  onUploadedCvCopyLink(cv: UploadedCvDto) {
    // Copy CV link to clipboard
    const cvUrl = `${window.location.origin}/candidate/cv-management/uploaded/view/${cv.id}`;
    navigator.clipboard.writeText(cvUrl).then(() => {
      this.showToastMessage('Đã sao chép liên kết CV', 'success');
    }).catch(() => {
      this.showToastMessage('Sao chép liên kết thất bại', 'error');
    });
  }

  onUploadedCvRename(cv: UploadedCvDto) {
    this.cvToRename = cv;
    this.showRenameModal = true;
  }

  onUploadedCvDelete(cv: UploadedCvDto) {
    if (!cv.id) return;
    
    if (confirm('Bạn có chắc chắn muốn xóa CV này?')) {
      this.uploadedCvService.delete(cv.id).subscribe({
        next: () => {
          this.showToastMessage('Xóa CV thành công', 'success');
          this.loadUploadedCvs(); // Reload list
        },
        error: (error) => {
          console.error('Error deleting CV:', error);
          this.showToastMessage('Xóa CV thất bại', 'error');
        }
      });
    }
  }

  onCvShareFacebook() {
    this.showToastMessage(this.translate('cv_card.share_facebook_success'), 'success');
  }

  // Download modal methods
  onCloseDownloadModal() {
    this.showDownloadModal = false;
    this.cvToDownload = null;
  }

  private cvToDownload: string | null = null;

  onDownloadCv(cvId: string) {
    // Lưu CV ID để download
    this.cvToDownload = cvId;
    this.showDownloadModal = true;
  }

  onDownloadWithoutLogo() {
    if (this.cvToDownload) {
      // Download với logo (paid option)
      this.downloadCvAsPdf(this.cvToDownload, false);
    }
    this.showDownloadModal = false;
    this.cvToDownload = null;
  }

  onDownloadFree() {
    if (this.cvToDownload) {
      // Download miễn phí (có logo của VCareer)
      this.downloadCvAsPdf(this.cvToDownload, true);
    }
    this.showDownloadModal = false;
    this.cvToDownload = null;
  }

  private downloadCvAsPdf(cvId: string, withLogo: boolean) {
    // Render CV thành HTML
    this.candidateCvService.renderCv(cvId).subscribe({
      next: async (response: any) => {
        // Extract HTML content
        let htmlContent = '';
        if (response.result?.htmlContent) {
          htmlContent = response.result.htmlContent;
        } else if (response.htmlContent) {
          htmlContent = response.htmlContent;
        } else if (response.data?.htmlContent) {
          htmlContent = response.data.htmlContent;
        }

        if (!htmlContent) {
          this.showToastMessage('Không thể render CV', 'error');
          return;
        }

        // Convert HTML to PDF
        try {
          const pdfBlob = await this.convertHtmlToPdf(htmlContent, withLogo);
          const fileName = this.cvs.find(c => c.id === cvId)?.title || 'CV.pdf';
          
          // Download PDF
          const link = document.createElement('a');
          link.href = pdfBlob;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup blob URL
          window.URL.revokeObjectURL(pdfBlob);
          
          this.showToastMessage('Tải CV thành công', 'success');
        } catch (error) {
          console.error('Error converting to PDF:', error);
          this.showToastMessage('Lỗi khi tạo PDF', 'error');
        }
      },
      error: (error) => {
        console.error('Error rendering CV:', error);
        this.showToastMessage('Lỗi khi render CV', 'error');
      }
    });
  }

  private async convertHtmlToPdf(htmlContent: string, withLogo: boolean = true): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Tạo temp div để render HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Apply styles
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '900px';
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        
        document.body.appendChild(tempDiv);

        // Đợi styles và images load
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Convert to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        // Remove temp div
        document.body.removeChild(tempDiv);

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Calculate page height
        const pageHeight = 297; // A4 height in mm
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Add logo if withLogo = true (free download)
        if (withLogo) {
          // TODO: Add VCareer logo to PDF footer or header
          // Có thể thêm logo vào mỗi trang
          console.log('Adding VCareer logo to PDF');
        }
        
        // Get PDF as blob URL
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        resolve(url);
      } catch (error) {
        console.error('Error converting HTML to PDF:', error);
        reject(error);
      }
    });
  }

  // Rename modal methods
  onCloseRenameModal() {
    this.showRenameModal = false;
    this.cvToRename = null;
  }

  onRename(newName: string) {
    if (this.cvToRename && newName.trim()) {
      const cv = this.cvToRename as UploadedCvDto;
      if (cv.id) {
        this.uploadedCvService.update(cv.id, { cvName: newName.trim() }).subscribe({
          next: () => {
            this.showToastMessage('Đổi tên CV thành công', 'success');
            this.showRenameModal = false;
            this.cvToRename = null;
            this.loadUploadedCvs(); // Reload list
          },
          error: (error) => {
            console.error('Error renaming CV:', error);
            this.showToastMessage('Đổi tên CV thất bại', 'error');
          }
        });
      }
    }
  }

  trackByCvId(index: number, cv: UploadedCvDto): string {
    return cv.id || index.toString();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

