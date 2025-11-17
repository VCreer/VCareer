import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../core/services/navigation.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TeamManagementService } from '../../../../proxy/services/team-management';

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
    private teamManagementService: TeamManagementService
  ) {}

  ngOnInit(): void {
    if (!this.navigationService.isLoggedIn() || this.navigationService.getCurrentRole() !== 'recruiter') {
      this.router.navigate(['/recruiter/login']);
      return;
    }
    
    // Kiểm tra nếu user là HR Staff (IsLead = false) thì redirect về trang chủ
    this.teamManagementService.getCurrentUserInfo().subscribe({
      next: (userInfo) => {
        // HR Staff là user có IsLead = false, không được phép truy cập trang verify
        if (!userInfo.isLead) {
          this.router.navigate(['/recruiter/recruiter-setting']);
          return;
        }
        // Nếu là Leader thì tiếp tục hiển thị trang verify
        this.calculateCompletion();
        this.checkSidebarState();
        
        // Check sidebar state periodically (since sidebar is in header component)
        this.sidebarCheckInterval = setInterval(() => {
          this.checkSidebarState();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading user info:', error);
        // Nếu không lấy được thông tin, vẫn cho phép truy cập (fallback)
        this.calculateCompletion();
        this.checkSidebarState();
        
        // Check sidebar state periodically (since sidebar is in header component)
        this.sidebarCheckInterval = setInterval(() => {
          this.checkSidebarState();
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar.show');
    this.sidebarExpanded = !!sidebar;
    
    // Update page class
    const page = document.querySelector('.recruiter-verify-page');
    if (page) {
      if (this.sidebarExpanded) {
        page.classList.add('sidebar-expanded');
      } else {
        page.classList.remove('sidebar-expanded');
      }
    }
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
