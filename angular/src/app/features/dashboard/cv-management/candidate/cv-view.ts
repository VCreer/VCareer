import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateCvService } from '../../../../proxy/http-api/controllers/candidate-cv.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

@Component({
  selector: 'app-cv-view',
  standalone: true,
  imports: [
    CommonModule,
    ToastNotificationComponent
  ],
  templateUrl: './cv-view.html',
  styleUrls: ['./cv-view.scss']
})
export class CvViewComponent implements OnInit {
  cvId: string = '';
  loading: boolean = false;
  cvHtml: string = '';
  cvName: string = '';
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidateCvService: CandidateCvService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.cvId = this.route.snapshot.paramMap.get('cvId') || '';
    
    if (!this.cvId) {
      this.showToastMessage('Không tìm thấy CV. Vui lòng thử lại.', 'error');
      setTimeout(() => {
        this.router.navigate(['/candidate/cv-management']);
      }, 2000);
      return;
    }

    this.loadCv();
  }

  loadCv() {
    this.loading = true;
    
    // Lấy thông tin CV trước
    this.candidateCvService.get(this.cvId).subscribe({
      next: (response: any) => {
        let cv: any;
        if (response.result) {
          cv = response.result;
        } else if (response.data) {
          cv = response.data;
        } else {
          cv = response;
        }
        
        this.cvName = cv.cvName || 'CV';
        
        // Render CV
        this.renderCv();
      },
      error: (error) => {
        console.error('Error loading CV:', error);
        this.showToastMessage('Không thể tải CV. Vui lòng thử lại.', 'error');
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/candidate/cv-management']);
        }, 2000);
      }
    });
  }

  renderCv() {
    this.candidateCvService.renderCv(this.cvId).subscribe({
      next: (response: any) => {
        console.log('Render CV Response:', response);
        
        // Extract htmlContent từ ActionResult
        let htmlContent = '';
        if (response.result?.htmlContent) {
          htmlContent = response.result.htmlContent;
        } else if (response.htmlContent) {
          htmlContent = response.htmlContent;
        } else if (response.data?.htmlContent) {
          htmlContent = response.data.htmlContent;
        }
        
        if (!htmlContent) {
          console.error('No HTML content in response');
          this.showToastMessage('Không thể render CV. Vui lòng thử lại.', 'error');
          this.loading = false;
          return;
        }
        
        this.cvHtml = htmlContent;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error rendering CV:', error);
        this.showToastMessage('Lỗi khi render CV', 'error');
        this.loading = false;
      }
    });
  }

  onEditCv() {
    // Navigate đến trang edit với cvId
    // Cần load CV để lấy templateId
    this.candidateCvService.get(this.cvId).subscribe({
      next: (response: any) => {
        let cv: any;
        if (response.result) {
          cv = response.result;
        } else if (response.data) {
          cv = response.data;
        } else {
          cv = response;
        }
        
        if (cv.templateId) {
          // Navigate đến write-cv với templateId để edit
          // Có thể cần thêm logic để load data vào form
          this.router.navigate(['/candidate/write-cv', cv.templateId], {
            queryParams: { cvId: this.cvId, mode: 'edit' }
          });
        } else {
          this.showToastMessage('Không tìm thấy template của CV này.', 'error');
        }
      },
      error: (error) => {
        console.error('Error getting CV:', error);
        this.showToastMessage('Không thể tải thông tin CV.', 'error');
      }
    });
  }

  onDownloadCv() {
    // TODO: Implement download CV as PDF
    this.showToastMessage('Tính năng tải CV sẽ được triển khai sớm.', 'info');
  }

  onCopyCv() {
    // Copy CV link to clipboard
    const link = `${window.location.origin}/candidate/cv-management/view/${this.cvId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.showToastMessage('Đã sao chép link CV!', 'success');
    }).catch(() => {
      this.showToastMessage('Không thể sao chép link.', 'error');
    });
  }

  onBack() {
    this.router.navigate(['/candidate/cv-management']);
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
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
}

