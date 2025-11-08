import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { CandidateCvService } from '../../../proxy/http-api/controllers/candidate-cv.service';
import { UploadedCvService } from '../../../proxy/http-api/controllers/uploaded-cv.service';
import { ApplicationService } from '../../../proxy/http-api/controllers/application.service';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import type { CandidateCvDto } from '../../../proxy/cv/models';
import type { UploadedCvDto } from '../../../proxy/application/contracts/cv/models';

@Component({
  selector: 'app-apply-job-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apply-job-modal.html',
  styleUrls: ['./apply-job-modal.scss']
})
export class ApplyJobModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Input() jobId: string = ''; // Job ID để submit application
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{success: boolean, message: string}>();

  // CV Selection
  selectedCVOption: string = 'library'; // 'library' or 'upload'
  selectedOnlineCvId: string = '';
  selectedUploadedCvId: string = '';
  
  // Upload CV
  uploadedFile: File | null = null;
  
  // Cover Letter
  coverLetter: string = '';
  
  // CV Lists
  onlineCvs: CandidateCvDto[] = [];
  uploadedCvs: UploadedCvDto[] = [];
  loadingCvs: boolean = false;
  
  // Validation errors
  cvError: string = '';
  coverLetterError: string = '';

  constructor(
    private translationService: TranslationService,
    private candidateCvService: CandidateCvService,
    private uploadedCvService: UploadedCvService,
    private applicationService: ApplicationService,
    @Inject(HttpClient) private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Load CVs when component initializes
    if (this.show) {
      this.loadCvs();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload CVs when modal is opened
    if (changes['show'] && changes['show'].currentValue === true) {
      this.loadCvs();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  // Load CVs when modal opens
  loadCvs(): void {
    this.loadingCvs = true;
    this.loadOnlineCvs();
    this.loadUploadedCvs();
  }

  loadOnlineCvs(): void {
    this.candidateCvService.getList({
      skipCount: 0,
      maxResultCount: 1000,
      sorting: 'creationTime DESC'
    }).subscribe({
      next: (response: any) => {
        if (response.result?.items) {
          this.onlineCvs = response.result.items;
        } else if (response.items) {
          this.onlineCvs = response.items;
        } else if (Array.isArray(response)) {
          this.onlineCvs = response;
        }
        this.loadingCvs = false;
      },
      error: (error) => {
        console.error('Error loading online CVs:', error);
        this.onlineCvs = [];
        this.loadingCvs = false;
      }
    });
  }

  loadUploadedCvs(): void {
    this.uploadedCvService.getList({
      skipCount: 0,
      maxResultCount: 1000,
      sorting: 'creationTime DESC'
    }).subscribe({
      next: (response: any) => {
        if (response.result?.items) {
          this.uploadedCvs = response.result.items;
        } else if (response.items) {
          this.uploadedCvs = response.items;
        } else if (Array.isArray(response)) {
          this.uploadedCvs = response;
        }
        this.loadingCvs = false;
      },
      error: (error) => {
        console.error('Error loading uploaded CVs:', error);
        this.uploadedCvs = [];
        this.loadingCvs = false;
      }
    });
  }

  onCVOptionChange(): void {
    // Reset selections when switching options
    this.selectedOnlineCvId = '';
    this.selectedUploadedCvId = '';
    this.uploadedFile = null;
    this.cvError = '';
  }

  validateForm(): boolean {
    let isValid = true;
    this.cvError = '';
    
    if (this.selectedCVOption === 'library') {
      // Validate library CV selection
      if (!this.selectedOnlineCvId && !this.selectedUploadedCvId) {
        this.cvError = 'Vui lòng chọn một CV để ứng tuyển';
        isValid = false;
      }
    } else if (this.selectedCVOption === 'upload') {
      // Validate upload CV
      if (!this.uploadedFile) {
        this.cvError = 'Vui lòng chọn file CV để tải lên';
        isValid = false;
      }
    }
    
    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.jobId) {
      this.submit.emit({
        success: false,
        message: 'Không tìm thấy thông tin công việc'
      });
      return;
    }

    if (this.selectedCVOption === 'library') {
      this.submitWithLibraryCv();
    } else if (this.selectedCVOption === 'upload') {
      this.submitWithUploadCv();
    }
  }

  submitWithLibraryCv(): void {
    if (this.selectedOnlineCvId) {
      // Submit with online CV
      this.applicationService.applyWithOnlineCV({
        jobId: this.jobId,
        candidateCvId: this.selectedOnlineCvId,
        coverLetter: this.coverLetter || undefined
      }).subscribe({
        next: (response: any) => {
          this.submit.emit({
            success: true,
            message: this.translate('apply_modal.submit_success') || 'Nộp đơn ứng tuyển thành công'
          });
          this.resetForm();
          this.onClose();
        },
        error: (error: any) => {
          const errorMessage = error.error?.error?.message || error.error?.message || error.message || 'Nộp đơn ứng tuyển thất bại';
          this.submit.emit({
            success: false,
            message: errorMessage
          });
        }
      });
    } else if (this.selectedUploadedCvId) {
      // Submit with uploaded CV
      this.applicationService.applyWithUploadedCV({
        jobId: this.jobId,
        uploadedCvId: this.selectedUploadedCvId,
        coverLetter: this.coverLetter || undefined
      }).subscribe({
        next: (response: any) => {
          this.submit.emit({
            success: true,
            message: this.translate('apply_modal.submit_success') || 'Nộp đơn ứng tuyển thành công'
          });
          this.resetForm();
          this.onClose();
        },
        error: (error: any) => {
          const errorMessage = error.error?.error?.message || error.error?.message || error.message || 'Nộp đơn ứng tuyển thất bại';
          this.submit.emit({
            success: false,
            message: errorMessage
          });
        }
      });
    }
  }

  submitWithUploadCv(): void {
    if (!this.uploadedFile) {
      return;
    }

    // First upload the CV file
    const formData = new FormData();
    formData.append('file', this.uploadedFile);
    formData.append('cvName', this.uploadedFile.name);
    formData.append('isDefault', 'false');
    formData.append('isPublic', 'false');

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const headers: any = {
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.http.post<any>('https://localhost:44385/api/cv/uploaded/upload', formData, { headers }).subscribe({
      next: (response: any) => {
        // Get uploaded CV ID from response
        let uploadedCvId: string = '';
        if (response.result?.id) {
          uploadedCvId = response.result.id;
        } else if (response.id) {
          uploadedCvId = response.id;
        } else if (response.result?.result?.id) {
          uploadedCvId = response.result.result.id;
        }

        if (!uploadedCvId) {
          this.submit.emit({
            success: false,
            message: 'Không thể lấy ID của CV đã tải lên'
          });
          return;
        }

        // Then submit application with uploaded CV
        this.applicationService.applyWithUploadedCV({
          jobId: this.jobId,
          uploadedCvId: uploadedCvId,
          coverLetter: this.coverLetter || undefined
        }).subscribe({
          next: (response: any) => {
            this.submit.emit({
              success: true,
              message: this.translate('apply_modal.submit_success') || 'Nộp đơn ứng tuyển thành công'
            });
            this.resetForm();
            this.onClose();
          },
          error: (error: any) => {
            const errorMessage = error.error?.error?.message || error.error?.message || error.message || 'Nộp đơn ứng tuyển thất bại';
            this.submit.emit({
              success: false,
              message: errorMessage
            });
          }
        });
      },
      error: (error: any) => {
        const errorMessage = error.error?.error?.message || error.error?.message || error.message || 'Tải lên CV thất bại';
        this.submit.emit({
          success: false,
          message: errorMessage
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
  }

  onUploadBtnClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const fileInput = document.getElementById('cv-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      this.cvError = 'File không hợp lệ. Chỉ hỗ trợ định dạng .pdf, .doc, .docx';
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.cvError = 'File quá lớn. Kích thước tối đa là 5MB';
      return;
    }

    this.uploadedFile = file;
    this.cvError = '';
    this.selectedCVOption = 'upload';
  }

  removeFile(): void {
    this.uploadedFile = null;
    this.cvError = '';
  }

  resetForm(): void {
    this.selectedCVOption = 'library';
    this.selectedOnlineCvId = '';
    this.selectedUploadedCvId = '';
    this.uploadedFile = null;
    this.coverLetter = '';
    this.cvError = '';
    this.coverLetterError = '';
  }

  // Helper methods
  getSelectedOnlineCvName(): string {
    const cv = this.onlineCvs.find(c => c.id === this.selectedOnlineCvId);
    return cv?.cvName || '';
  }

  getSelectedUploadedCvName(): string {
    const cv = this.uploadedCvs.find(c => c.id === this.selectedUploadedCvId);
    return cv?.cvName || cv?.originalFileName || '';
  }
}
