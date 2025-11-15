import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../core/services/navigation.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { SidebarLayoutService } from '../../../../core/services/sidebar-layout.service';

export interface VerificationStep {
  id: string;
  title: string;
  completed: boolean;
  hasPoints?: boolean;
  points?: number;
}

@Component({
  selector: 'app-recruiter-verify-otp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-verify-otp.html',
  styleUrls: ['./recruiter-verify-otp.scss']
})
export class RecruiterVerifyOtpComponent implements OnInit, OnDestroy {
  userName: string = 'Uông Hoàng Duy';
  jobPosition: string = 'Nhân viên Marketing';
  completionPercentage: number = 0;
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  
  verificationSteps: VerificationStep[] = [
    { id: 'phone', title: 'verify.step_phone', completed: false },
    { id: 'company', title: 'verify.step_company', completed: false },
    { id: 'license', title: 'verify.step_license', completed: false }
  ];

  stats = {
    applications: '80.000+',
    profiles: '130.000+',
    companies: ['Techcombank', 'Panasonic Việt Nam', 'Yamaha Motor Việt Nam']
  };

  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private translationService: TranslationService,
    private sidebarLayoutService: SidebarLayoutService
  ) {}

  ngOnInit(): void {
    if (!this.navigationService.isLoggedIn() || this.navigationService.getCurrentRole() !== 'recruiter') {
      this.router.navigate(['/recruiter/login']);
      return;
    }
    this.calculateCompletion();
    this.updateSidebarState();
    
    // Subscribe to sidebar width changes
    this.sidebarLayoutService.sidebarWidth$.subscribe(width => {
      this.sidebarWidth = width;
      this.sidebarExpanded = width > 100;
    });

    // Check sidebar state periodically
    this.sidebarCheckInterval = setInterval(() => {
      this.updateSidebarState();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateSidebarState();
  }

  private updateSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || rect.width > 100;
    } else {
      this.sidebarWidth = 0;
      this.sidebarExpanded = false;
    }
  }

  getContentPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 768) {
      return '100%';
    }
    const padding = 48; // 24px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - padding;
    return `${Math.max(0, availableWidth)}px`;
  }

  calculateCompletion(): void {
    const completed = this.verificationSteps.filter(step => step.completed).length;
    this.completionPercentage = (completed / this.verificationSteps.length) * 100;
  }

  onStepClick(step: VerificationStep): void {
    switch(step.id) {
      case 'phone':
        this.router.navigate(['/recruiter/verify-phone']);
        break;
      case 'company':
        this.router.navigate(['/recruiter/update-company']);
        break;
      case 'license':
        this.router.navigate(['/recruiter/update-license']);
        break;
      case 'first_job':
        this.router.navigate(['/recruiter/post-job']);
        break;
    }
  }

  onNextStep(): void {
    const firstIncomplete = this.verificationSteps.find(step => !step.completed);
    if (firstIncomplete) {
      this.onStepClick(firstIncomplete);
    } else {
      // All steps completed, mark as verified
      this.navigationService.setVerified(true);
      this.router.navigate(['/recruiter/home']);
    }
  }

  getNextStepTitle(): string {
    const firstIncomplete = this.verificationSteps.find(step => !step.completed);
    if (firstIncomplete) {
      return this.translate(firstIncomplete.title);
    }
    return this.translate('verify.complete');
  }

  onSkip(): void {
    this.navigationService.setVerified(true);
    this.router.navigate(['/recruiter/home']);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
