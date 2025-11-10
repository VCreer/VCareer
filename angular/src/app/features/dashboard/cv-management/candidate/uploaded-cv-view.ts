import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslationService } from '../../../../core/services/translation.service';
import { UploadedCvService } from '../../../../proxy/http-api/controllers/uploaded-cv.service';
import { UploadedCvDto } from '../../../../proxy/application/contracts/cv/models';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

@Component({
  selector: 'app-uploaded-cv-view',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  template: `
    <div class="uploaded-cv-view-container">
      <!-- Header with Controls -->
      <div class="cv-view-header">
        <div class="header-left">
          <button class="btn-back" (click)="onBack()">
            <i class="fa fa-arrow-left"></i>
            {{ translate('cv_view.back') || 'Quay lại' }}
          </button>
          <h2 class="cv-name">{{ cvName || 'CV' }}</h2>
        </div>
        <div class="header-actions">
          <button class="btn-action" (click)="onDownload()" title="Tải về">
            <i class="fa fa-download"></i>
            <span>Tải về</span>
          </button>
          <button class="btn-action" (click)="onPrint()" title="In">
            <i class="fa fa-print"></i>
            <span>In</span>
          </button>
        </div>
      </div>

      <!-- PDF Viewer Controls -->
      <div class="pdf-controls" *ngIf="!loading && pdfUrl">
        <div class="control-group">
          <button class="btn-control" (click)="zoomOut()" [disabled]="zoom <= 50">
            <i class="fa fa-search-minus"></i>
          </button>
          <span class="zoom-level">{{ zoom }}%</span>
          <button class="btn-control" (click)="zoomIn()" [disabled]="zoom >= 200">
            <i class="fa fa-search-plus"></i>
          </button>
          <button class="btn-control" (click)="fitToWidth()">
            <i class="fa fa-arrows-h"></i>
            <span>Vừa với chiều rộng</span>
          </button>
        </div>
        <div class="control-group">
          <button class="btn-control" (click)="previousPage()" [disabled]="currentPage <= 1">
            <i class="fa fa-chevron-left"></i>
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn-control" (click)="nextPage()" [disabled]="currentPage >= totalPages">
            <i class="fa fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="loading-spinner">
          <i class="fa fa-spinner fa-spin"></i>
        </div>
        <p>Đang tải CV...</p>
      </div>

      <!-- PDF Viewer -->
      <div class="pdf-viewer-wrapper" *ngIf="!loading && pdfUrl">
        <div class="pdf-viewer-container" [style.transform]="'scale(' + (zoom / 100) + ')'" [style.transform-origin]="'top center'">
          <iframe 
            #pdfIframe
            [src]="pdfUrl" 
            class="pdf-iframe"
            frameborder="0"
            allowfullscreen
            (load)="onIframeLoad()">
          </iframe>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="!loading && error">
        <i class="fa fa-exclamation-triangle error-icon"></i>
        <p class="error-message">{{ error }}</p>
        <button class="btn-retry" (click)="loadCv()">Thử lại</button>
      </div>

      <!-- Toast Notification -->
      <app-toast-notification
        [show]="showToast"
        [message]="toastMessage"
        [type]="toastType"
        (close)="onToastClose()">
      </app-toast-notification>
    </div>
  `,
  styles: [`
    .uploaded-cv-view-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #525252;
      overflow: hidden;
    }

    .cv-view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #e5e7eb;
    }

    .cv-name {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-action {
      padding: 0.5rem 1rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-action:hover {
      background: #059669;
    }

    .pdf-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      gap: 1rem;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-control {
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-control:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-control:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .zoom-level, .page-info {
      padding: 0 0.75rem;
      font-weight: 500;
      color: #374151;
      min-width: 60px;
      text-align: center;
    }

    .pdf-viewer-wrapper {
      flex: 1;
      overflow: auto;
      background: #525252;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem;
    }

    .pdf-viewer-container {
      width: 100%;
      max-width: 1200px;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
      overflow: hidden;
    }

    .pdf-iframe {
      width: 100%;
      min-height: 800px;
      border: none;
      display: block;
    }

    .loading-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: white;
    }

    .loading-spinner {
      font-size: 3rem;
      color: #10b981;
    }

    .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: white;
    }

    .error-icon {
      font-size: 3rem;
      color: #ef4444;
    }

    .error-message {
      font-size: 1.25rem;
    }

    .btn-retry {
      padding: 0.75rem 1.5rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-retry:hover {
      background: #059669;
    }
  `]
})
export class UploadedCvViewComponent implements OnInit, OnDestroy {
  @ViewChild('pdfIframe') pdfIframe!: ElementRef<HTMLIFrameElement>;
  
  cvId: string = '';
  cvName: string = '';
  pdfUrl: SafeResourceUrl | null = null;
  pdfBlobUrl: string = '';
  loading = false;
  error: string = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';
  
  // PDF viewer controls
  zoom = 100;
  currentPage = 1;
  totalPages = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uploadedCvService: UploadedCvService,
    private http: HttpClient,
    private translationService: TranslationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cvId = this.route.snapshot.paramMap.get('id') || '';
    if (this.cvId) {
      this.loadCv();
    } else {
      this.error = 'CV ID không hợp lệ';
    }
  }

  loadCv() {
    this.loading = true;
    this.error = '';

    // First, get CV details
    this.uploadedCvService.get(this.cvId).subscribe({
      next: (response: any) => {
        const cv: UploadedCvDto = response.result || response.value || response;
        this.cvName = cv.cvName || cv.originalFileName || 'CV';
        
        // Then download the PDF
        this.downloadPdf();
      },
      error: (error) => {
        console.error('Error loading CV:', error);
        this.error = 'Không thể tải thông tin CV';
        this.loading = false;
      }
    });
  }

  downloadPdf() {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    // Download file as blob
    this.http.get(`https://localhost:44385/api/cv/uploaded/${this.cvId}/download`, {
      responseType: 'blob',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).subscribe({
      next: (blob: Blob) => {
        // Create object URL from blob
        const url = window.URL.createObjectURL(blob);
        this.pdfBlobUrl = url;
        
        // Create safe URL for iframe
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url + '#toolbar=1&navpanes=1&scrollbar=1');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.error = 'Không thể tải file PDF';
        this.loading = false;
      }
    });
  }

  onIframeLoad() {
    // Try to get total pages from iframe (if PDF.js is available)
    try {
      const iframe = this.pdfIframe?.nativeElement;
      if (iframe && iframe.contentWindow) {
        // PDF.js exposes document properties
        // This is a fallback - browser PDF viewer may not expose this
        console.log('PDF iframe loaded');
      }
    } catch (e) {
      console.log('Could not access iframe content (expected for cross-origin)');
    }
  }

  zoomIn() {
    if (this.zoom < 200) {
      this.zoom += 25;
    }
  }

  zoomOut() {
    if (this.zoom > 50) {
      this.zoom -= 25;
    }
  }

  fitToWidth() {
    this.zoom = 100;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePdfUrl();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePdfUrl();
    }
  }

  updatePdfUrl() {
    if (this.pdfBlobUrl) {
      // Add page parameter to PDF URL
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `${this.pdfBlobUrl}#page=${this.currentPage}&toolbar=1&navpanes=1&scrollbar=1`
      );
    }
  }

  onDownload() {
    if (this.pdfBlobUrl) {
      const link = document.createElement('a');
      link.href = this.pdfBlobUrl;
      link.download = this.cvName || 'cv.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToastMessage('Đang tải CV...', 'info');
    }
  }

  onPrint() {
    if (this.pdfIframe?.nativeElement) {
      this.pdfIframe.nativeElement.contentWindow?.print();
    }
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  ngOnDestroy() {
    // Clean up blob URL to prevent memory leaks
    if (this.pdfBlobUrl) {
      window.URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }

  onBack() {
    this.router.navigate(['/candidate/cv-management']);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onToastClose() {
    this.showToast = false;
  }
}

