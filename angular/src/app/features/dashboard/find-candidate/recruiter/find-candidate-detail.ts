import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ButtonComponent,
  ToastNotificationComponent,
} from '../../../../shared/components';
import { CandidateSearchService } from '../../../../proxy/profile/candidate-search.service';
import { CandidateCvService } from '../../../../proxy/http-api/controllers/candidate-cv.service';
import { CompanyLegalInfoService } from '../../../../proxy/profile/company-legal-info.service';
import type { CandidateSearchResultDto } from '../../../../proxy/dto/profile/models';

@Component({
  selector: 'app-find-candidate-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './find-candidate-detail.html',
  styleUrls: ['./find-candidate-detail.scss'],
})
export class FindCandidateDetailComponent implements OnInit, OnDestroy {
  candidateId: string = '';
  candidate: CandidateSearchResultDto | null = null;
  contactUnlocked = false;
  connectionModalOpen = false;
  sendingRequest = false;
  connectionForm = {
    companyName: '',
    jobTitle: '',
    message:
      'Chúng tôi thấy bạn có hồ sơ phù hợp cho vị trí đang tuyển dụng. Nếu bạn quan tâm, hãy phản hồi lại để chúng tôi có thể liên hệ và trao đổi kỹ hơn.',
    emailInput: '',
    emails: [] as string[],
  };
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  isLoading = false;
  cvLoading = false;
  cvHtml: SafeHtml | null = null;

  private sidebarCheckInterval?: any;
  sidebarExpanded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidateSearchService: CandidateSearchService,
    private candidateCvService: CandidateCvService,
    private companyLegalInfoService: CompanyLegalInfoService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => this.checkSidebarState(), 150);
    this.loadRecruiterCompany();

    const candidateFromState = history.state?.candidate as CandidateSearchResultDto | undefined;

    this.route.paramMap.subscribe(params => {
      this.candidateId = params.get('candidateId') || '';
      if (!this.candidateId) {
        this.showToastMessage('Không xác định được ứng viên', 'error');
        this.router.navigate(['/recruiter/find-cv']);
        return;
      }

      if (candidateFromState && candidateFromState.id === this.candidateId) {
        this.candidate = candidateFromState;
        const cvId =
          this.route.snapshot.queryParamMap.get('cvId') ||
          candidateFromState.defaultCvId ||
          null;
        if (cvId) {
          this.loadCandidateCv(cvId);
        }
      }

      this.loadCandidateDetail();
    });
  }

  private loadRecruiterCompany(): void {
    this.companyLegalInfoService.getCurrentUserCompanyLegalInfo().subscribe({
      next: company => {
        if (company?.companyName) {
          this.connectionForm.companyName = company.companyName;
        }
      },
      error: () => {},
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
      this.sidebarExpanded =
        sidebar.classList.contains('show') || rect.width > 100;
    }
  }

  loadCandidateDetail(): void {
    this.isLoading = true;
    this.candidateSearchService.getCandidateDetail(this.candidateId).subscribe({
      next: response => {
        const result =
          ((response as any)?.value ?? response) as CandidateSearchResultDto | null;

        if (!result) {
          this.showToastMessage('Không tìm thấy ứng viên', 'error');
          this.isLoading = false;
          return;
        }

        this.candidate = result;
        this.isLoading = false;
        const cvId =
          this.route.snapshot.queryParamMap.get('cvId') ||
          result.defaultCvId ||
          null;
        if (cvId) {
          this.loadCandidateCv(cvId);
        }
      },
      error: error => {
        console.error('Error loading candidate detail', error);
        this.isLoading = false;
        this.showToastMessage('Không thể tải thông tin ứng viên', 'error');
      },
    });
  }

  loadCandidateCv(cvId: string): void {
    this.cvLoading = true;
    this.candidateCvService.renderCv(cvId).subscribe({
      next: renderResult => {
        const htmlContent =
          ((renderResult as any)?.value ?? renderResult)?.htmlContent;

        if (htmlContent) {
          this.cvHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
        } else {
          this.cvHtml = null;
        }

        this.cvLoading = false;
      },
      error: error => {
        console.error('Error loading candidate CV', error);
        this.cvLoading = false;
        this.cvHtml = null;
        this.showToastMessage('CV của ứng viên chưa khả dụng', 'warning');
      },
    });
  }

  onUnlockContact(): void {
    this.connectionModalOpen = true;
  }

  closeConnectionModal(): void {
    this.connectionModalOpen = false;
  }

  removeEmail(index: number): void {
    this.connectionForm.emails.splice(index, 1);
  }

  addEmailFromInput(): void {
    const value = this.connectionForm.emailInput.trim();
    if (!value) return;
    if (this.connectionForm.emails.length >= 5) {
      this.showToastMessage('Tối đa 5 email phản hồi', 'warning');
      return;
    }
    if (!this.isValidEmail(value)) {
      this.showToastMessage('Email không hợp lệ', 'error');
      return;
    }
    if (!this.connectionForm.emails.includes(value)) {
      this.connectionForm.emails.push(value);
    }
    this.connectionForm.emailInput = '';
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  submitConnectionRequest(): void {
    if (!this.candidate) return;
    if (!this.connectionForm.companyName.trim() || !this.connectionForm.jobTitle.trim()) {
      this.showToastMessage('Vui lòng nhập đầy đủ tên công ty và vị trí', 'error');
      return;
    }
    if (
      this.connectionForm.emails.length === 0 &&
      this.connectionForm.emailInput.trim() === ''
    ) {
      this.showToastMessage('Vui lòng nhập ít nhất 1 email phản hồi', 'error');
      return;
    }

    if (this.connectionForm.emailInput.trim()) {
      this.addEmailFromInput();
    }

    this.sendingRequest = true;
    const payload = {
      candidateProfileId: this.candidate.id,
      companyName: this.connectionForm.companyName.trim(),
      jobTitle: this.connectionForm.jobTitle.trim(),
      message: this.connectionForm.message.trim(),
      emails: this.connectionForm.emails,
    };

    this.candidateSearchService
      .sendConnectionRequest(this.candidate.id!, payload)
      .subscribe({
        next: () => {
          this.sendingRequest = false;
          this.connectionModalOpen = false;
          this.contactUnlocked = true;
          this.showToastMessage('Đã gửi yêu cầu kết nối', 'success');
        },
        error: error => {
          console.error('Error sending connection request', error);
          this.sendingRequest = false;
          this.showToastMessage('Gửi yêu cầu thất bại', 'error');
        },
      });
  }

  showToastMessage(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }

  getMaskedValue(value?: string): string {
    if (this.contactUnlocked) {
      return value || 'Chưa cập nhật';
    }
    return value ? '[protected data]' : 'Chưa cập nhật';
  }

  getInitials(name?: string): string {
    if (!name) return 'CV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatUpdatedTime(dateString?: string): string {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Chưa cập nhật';
    }
  }

  getCandidateCode(): string {
    if (!this.candidate?.id) return '—';
    return this.candidate.id.slice(-8).toUpperCase();
  }
}

