import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../core/services/navigation.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import { combineLatest, firstValueFrom, timeout, of } from 'rxjs';
import { filter, take, catchError } from 'rxjs/operators';

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
    private teamManagementService: TeamManagementService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('RecruiterVerifyOtpComponent: ngOnInit started');
    
    // Cập nhật auth state từ cookies trước khi kiểm tra
    this.navigationService.updateAuthStateFromRoute();
    
    try {
      // Đợi auth state được cập nhật thực sự bằng Observable (max 5 giây)
      const [isLoggedIn, userRole] = await firstValueFrom(
        combineLatest([
          this.navigationService.isLoggedIn$,
          this.navigationService.userRole$
        ]).pipe(
          timeout(5000), // Timeout sau 5 giây
          take(1), // Chỉ lấy giá trị đầu tiên
          catchError((error) => {
            console.error('Timeout waiting for auth state:', error);
            // Fallback: lấy giá trị hiện tại
            return of([
              this.navigationService.isLoggedIn(),
              this.navigationService.getCurrentRole()
            ]);
          })
        )
      );
      
      console.log('Auth state loaded:', { isLoggedIn, userRole });
      console.log('isLoggedIn type:', typeof isLoggedIn, 'value:', isLoggedIn);
      console.log('userRole type:', typeof userRole, 'value:', userRole);
      console.log('Check result:', !isLoggedIn, userRole !== 'recruiter');
      
      // Kiểm tra đăng nhập và role
      if (!isLoggedIn || userRole !== 'recruiter') {
        console.log('Not logged in or not recruiter, redirecting to login');
        console.log('Redirect reason: isLoggedIn =', isLoggedIn, ', userRole =', userRole);
        this.router.navigate(['/recruiter/login']);
        return;
      }

      console.log('Auth check passed, loading component...');
      this.calculateCompletion();
      this.checkSidebarState();

      // Kiểm tra nếu user là HR Staff (IsLead = false) thì redirect về setting
      this.teamManagementService.getCurrentUserInfo().subscribe({
        next: (userInfo) => {
          console.log('User info loaded:', userInfo);
          // HR Staff là user có IsLead = false, không được phép truy cập trang verify
          if (!userInfo.isLead) {
            console.log('User is HR Staff, redirecting to settings');
            this.router.navigate(['/recruiter/recruiter-setting']);
            return;
          }
          console.log('User is Leader, showing verify page');
          // Nếu là Leader thì tiếp tục hiển thị trang verify
        },
        error: (error) => {
          console.error('Error loading user info:', error);
          // Nếu không lấy được thông tin user nhưng đã đăng nhập, vẫn cho phép truy cập (fallback)
        }
      });
      
      // Check sidebar state periodically (since sidebar is in header component)
      this.sidebarCheckInterval = setInterval(() => {
        this.checkSidebarState();
      }, 100);
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.router.navigate(['/recruiter/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || rect.width > 100;
    } else {
      this.sidebarWidth = 0;
      this.sidebarExpanded = false;
    }
    
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
