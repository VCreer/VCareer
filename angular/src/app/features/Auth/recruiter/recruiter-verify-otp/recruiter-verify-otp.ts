import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../core/services/navigation.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TeamManagementService } from '../../../../proxy/services/team-management';
import { ProfileService } from '../../../../proxy/profile/profile.service';
import { CompanyLegalInfoService } from '../../../../proxy/profile/company-legal-info.service';
import { combineLatest, firstValueFrom, timeout, of } from 'rxjs';
import { filter, take, catchError } from 'rxjs/operators';

export interface VerificationStep {
  id: string;
  label: string;
  completed: boolean;
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
  sidebarExpanded: boolean = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  
  // Account verification
  verificationLevel: string = 'Cấp 1/3';
  verificationProgress: number = 0;
  verificationSteps: VerificationStep[] = [
    { id: 'email', label: 'Xác thực email', completed: false },
    { id: 'company', label: 'Cập nhật thông tin công ty', completed: false },
    { id: 'license', label: 'Xác thực Giấy đăng ký doanh nghiệp', completed: false }
  ];
  verificationProgressSteps: number = 0;

  stats = {
    applications: '80.000+',
    profiles: '130.000+',
    companies: ['Techcombank', 'Panasonic Việt Nam', 'Yamaha Motor Việt Nam']
  };

  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private translationService: TranslationService,
    private teamManagementService: TeamManagementService,
    private profileService: ProfileService,
    private companyLegalInfoService: CompanyLegalInfoService
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
      if (!isLoggedIn) {
        console.log('Not logged in, redirecting to login');
        this.router.navigate(['/recruiter/login']);
        return;
      }
      
      // Nếu role chưa phải recruiter, thử load lại user info để kiểm tra
      if (userRole !== 'recruiter') {
        console.log('Role is not recruiter yet:', userRole, '- checking user info...');
        
        // Thử load user info từ team management service
        this.teamManagementService.getCurrentUserInfo().subscribe({
          next: (userInfo) => {
            console.log('User info loaded:', userInfo);
            if (userInfo && (userInfo.isLead !== undefined || userInfo.email)) {
              // User có recruiter profile, cho phép tiếp tục và cập nhật role
              console.log('User has recruiter profile, allowing access');
              this.navigationService.loginAsRecruiter();
              this.checkSidebarState();
              this.loadVerificationData();
            } else {
              // Không có recruiter profile, đợi thêm một chút rồi thử lại
              console.log('No recruiter profile found, waiting and retrying...');
              setTimeout(() => {
                this.navigationService.updateAuthStateFromRoute();
                const updatedRole = this.navigationService.getCurrentRole();
                if (updatedRole === 'recruiter') {
                  console.log('Role updated to recruiter after wait');
                  this.checkSidebarState();
                  this.loadVerificationData();
                } else {
                  console.log('Still not recruiter after wait, redirecting to login');
                  this.router.navigate(['/recruiter/login']);
                }
              }, 2000);
            }
          },
          error: (err) => {
            console.error('Error loading user info:', err);
            // Đợi một chút rồi thử lại với navigation service
            setTimeout(() => {
              this.navigationService.updateAuthStateFromRoute();
              const updatedRole = this.navigationService.getCurrentRole();
              if (updatedRole === 'recruiter') {
                console.log('Role updated to recruiter after error recovery');
                this.checkSidebarState();
                this.loadVerificationData();
              } else {
                // Cho phép tiếp tục vì có thể là lỗi tạm thời sau khi đăng ký
                console.log('Allowing access despite role check (may be temporary after registration)');
                this.checkSidebarState();
                this.loadVerificationData();
              }
            }, 2000);
          }
        });
        return;
      }

      console.log('Auth check passed, loading component...');
      this.checkSidebarState();
      
      // Load verification data
      this.loadVerificationData();

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

  loadVerificationData(): void {
    // Load profile to check email verification
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        // Update userName from profile
        const name = profile.name || '';
        const surname = profile.surname || '';
        this.userName = `${name} ${surname}`.trim() || 'User';
        
        // Check email verification (step 1)
        const isEmailVerified = !!profile.emailConfirmed;
        this.updateEmailVerificationStepStatus(isEmailVerified);
        
        // Load company info if companyId exists
        const companyId = profile.companyId;
        if (companyId) {
          this.loadCompanyVerificationData(companyId);
        } else {
          // No company selected, mark steps 2 and 3 as incomplete
          this.updateCompanyVerificationStepStatus(false);
          this.updateLegalVerificationStepStatus(false);
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        // On error, assume all steps incomplete
        this.updateEmailVerificationStepStatus(false);
        this.updateCompanyVerificationStepStatus(false);
        this.updateLegalVerificationStepStatus(false);
      }
    });
  }

  loadCompanyVerificationData(companyId: number): void {
    this.companyLegalInfoService.getCompanyLegalInfo(companyId).subscribe({
      next: (companyDetail) => {
        // Check if company info is updated (step 2)
        // Consider company info updated if companyName and other basic info exists
        const hasCompanyInfo = !!(companyDetail.companyName && 
                                 companyDetail.headquartersAddress && 
                                 companyDetail.contactEmail);
        this.updateCompanyVerificationStepStatus(hasCompanyInfo);
        
        // Check if legal document is verified (step 3)
        const isLegalVerified = companyDetail.legalVerificationStatus === 'approved';
        this.updateLegalVerificationStepStatus(isLegalVerified);
      },
      error: (error) => {
        console.error('Error loading company detail:', error);
        // On error, mark steps 2 and 3 as incomplete
        this.updateCompanyVerificationStepStatus(false);
        this.updateLegalVerificationStepStatus(false);
      }
    });
  }

  private updateEmailVerificationStepStatus(isCompleted: boolean): void {
    this.verificationSteps = this.verificationSteps.map(step => {
      if (step.id === 'email') {
        return { ...step, completed: isCompleted };
      }
      return step;
    });
    this.updateVerificationProgress();
  }

  private updateCompanyVerificationStepStatus(isCompleted: boolean): void {
    this.verificationSteps = this.verificationSteps.map(step => {
      if (step.id === 'company') {
        return { ...step, completed: isCompleted };
      }
      return step;
    });
    this.updateVerificationProgress();
  }

  private updateLegalVerificationStepStatus(isCompleted: boolean): void {
    this.verificationSteps = this.verificationSteps.map(step => {
      if (step.id === 'license') {
        return { ...step, completed: isCompleted };
      }
      return step;
    });
    this.updateVerificationProgress();
  }

  updateVerificationProgress(): void {
    const completed = this.verificationSteps.filter(step => step.completed).length;
    this.verificationProgressSteps = completed;
    this.verificationProgress = Math.round((completed / this.verificationSteps.length) * 100);
    const levelStep = completed === 0 ? 1 : completed;
    this.verificationLevel = `Cấp ${Math.min(levelStep, this.verificationSteps.length)}/3`;

    // Nếu đã hoàn thành đủ 3/3 bước, cập nhật trạng thái xác thực global
    const isFullyVerified = completed === this.verificationSteps.length;
    this.navigationService.setVerified(isFullyVerified);
  }

  onStepClick(step: VerificationStep): void {
    switch(step.id) {
      case 'email':
        // Navigate to email verification or open modal
        this.router.navigate(['/recruiter/recruiter-setting'], { queryParams: { tab: 'personal-info' } });
        break;
      case 'company':
        this.router.navigate(['/recruiter/recruiter-setting'], { queryParams: { tab: 'company-info' } });
        break;
      case 'license':
        this.router.navigate(['/recruiter/recruiter-setting'], { queryParams: { tab: 'business-cert' } });
        break;
    }
  }

  onLearnMore(): void {
    // Navigate to help or information page
    // For now, just navigate to settings
    this.router.navigate(['/recruiter/recruiter-setting']);
  }

}
