import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { filter, catchError } from 'rxjs/operators';
import { AuthStateService } from './auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from './auth-Cookiebased/auth-facade.service';
import { TeamManagementService } from '../../proxy/services/team-management';
import { ProfileService } from '../../proxy/profile/profile.service';
import { CompanyLegalInfoService } from '../../proxy/profile/company-legal-info.service';

export type UserRole = 'candidate' | 'recruiter' | null;

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userRoleSubject = new BehaviorSubject<UserRole>(null);
  private isVerifiedSubject = new BehaviorSubject<boolean>(false);
  
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public userRole$ = this.userRoleSubject.asObservable();
  public isVerified$ = this.isVerifiedSubject.asObservable();

  constructor(
    private router: Router,
    private authStateService: AuthStateService,
    private authFacadeService: AuthFacadeService,
    private teamManagementService: TeamManagementService,
    private profileService: ProfileService,
    private companyLegalInfoService: CompanyLegalInfoService
  ) {
    console.log('[NavigationService] Constructor');
    
    // CRITICAL: Subscribe vào user changes từ AuthStateService
    // APP_INITIALIZER đã load user rồi, chỉ cần lắng nghe thay đổi
    this.authStateService.user$.subscribe(user => {
      console.log('[NavigationService] User changed in authStateService:', user);
      this.updateAuthStateFromUser(user);
      
      // Reload verification status khi user data được update (sau khi đăng nhập lại)
      if (user && this.getCurrentRole() === 'recruiter') {
        setTimeout(() => {
          this.reloadVerificationStatus();
        }, 500);
      }
    });
    
    // KHÔNG cần subscribe vào router events để load user
    // APP_INITIALIZER đã xử lý việc load user ban đầu
  }
  
  // REMOVED: initializeAuthStateIfNeeded()
  // APP_INITIALIZER đã load user, không cần load lại
  
  // Clear auth state
  private clearAuthState() {
    this.isLoggedInSubject.next(false);
    this.userRoleSubject.next(null);
    this.isVerifiedSubject.next(false);
    this.authStateService.setUser(null);
  }

  private updateAuthStateFromUser(user: any) {
    if (!user) {
      this.isLoggedInSubject.next(false);
      this.userRoleSubject.next(null);
      this.isVerifiedSubject.next(false);
      return;
    }

    // Xác định role dựa vào roles array
    const roles = user.roles || [];
    let userRole: UserRole = null;
    
    if (roles.length > 0) {
    const rolesLowerCase = roles.map((r: string) => r.toLowerCase());
    
      // Priority: recruiter > candidate
    if (rolesLowerCase.some((r: string) => r.includes('recruiter') || r === 'hr_staff')) {
      userRole = 'recruiter';
    } else if (rolesLowerCase.includes('candidate')) {
      userRole = 'candidate';
      }
    } else {
      // Fallback: determine from route
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/recruiter')) {
        userRole = 'recruiter';
      } else if (currentPath.startsWith('/candidate') || currentPath === '/' || currentPath === '/home') {
        userRole = 'candidate';
      } else {
        userRole = 'candidate'; // Default
      }
    }

    // Cập nhật trạng thái đăng nhập + role
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next(userRole);

    // Verification status (chỉ cho recruiter)
    if (userRole !== 'recruiter') {
      this.isVerifiedSubject.next(false);
    } else {
      // Nếu user có sẵn verificationStatus thì ưu tiên dùng, ngược lại gọi backend để lấy
      const verificationStatus = (user as any)?.verificationStatus;
      if (verificationStatus !== undefined) {
        this.isVerifiedSubject.next(verificationStatus);
      } else {
        this.loadVerificationStatus(0);
      }
    }
  }

  // Load verification status từ backend
  private loadVerificationStatus(retryCount: number = 0): void {
    const maxRetries = 2; // Chỉ retry tối đa 2 lần
    
    this.teamManagementService.getCurrentUserInfo().pipe(
      catchError(error => {
        console.error('[NavigationService] Error loading user info:', error);
        // Retry sau 1 giây nếu lỗi và chưa vượt quá maxRetries
        if (retryCount < maxRetries) {
          setTimeout(() => {
            this.loadVerificationStatus(retryCount + 1);
          }, 1000);
        } else {
          this.isVerifiedSubject.next(false);
        }
        return of(null);
      })
    ).subscribe({
      next: (userInfo) => {
        if (!userInfo) {
          // Retry sau 1 giây nếu không có userInfo và chưa vượt quá maxRetries
          if (retryCount < maxRetries) {
            setTimeout(() => {
              this.loadVerificationStatus(retryCount + 1);
            }, 1000);
          } else {
            this.isVerifiedSubject.next(false);
          }
          return;
        }

        // Kiểm tra verification status dựa trên các bước xác thực
        // Nếu là HR Staff (không phải Leader), coi như đã verified (vì Leader đã verify công ty)
        if (!userInfo.isLead) {
          // HR Staff: coi như đã verified vì công ty đã được Leader verify
          this.isVerifiedSubject.next(true);
          return;
        }

        // Leader: cần kiểm tra 3 bước xác thực
        // Bước 1: Email verification (emailConfirmed)
        // Bước 2: Company verification (có companyId và company đã được verify)
        // Bước 3: Legal verification (legalVerificationStatus === 'approved')
        this.loadFullVerificationStatus(userInfo.companyId);
      }
    });
  }

  // Public method để reload verification status (có thể gọi từ bên ngoài)
  reloadVerificationStatus(): void {
    const currentRole = this.getCurrentRole();
    if (currentRole === 'recruiter') {
      this.loadVerificationStatus(0); // Reset retry count
    }
  }

  // Load đầy đủ verification status cho Leader
  private loadFullVerificationStatus(companyId?: number): void {
    // Load profile để lấy emailConfirmed
    const profile$ = this.profileService.getCurrentUserProfile().pipe(
      catchError(error => {
        console.error('[NavigationService] Error loading profile:', error);
        return of(null);
      })
    );

    // Load company legal info nếu có companyId
    const company$ = companyId 
      ? this.companyLegalInfoService.getCompanyLegalInfo(companyId).pipe(
          catchError(error => {
            console.error('[NavigationService] Error loading company info:', error);
            return of(null);
          })
        )
      : of(null);

    forkJoin({
      profile: profile$,
      company: company$
    }).subscribe({
      next: ({ profile, company }) => {
        // Bước 1: Email verification
        const emailVerified = !!profile?.emailConfirmed;

        // Bước 2: Company verification (có companyId và company đã được verify)
        const companyVerified = !!companyId && !!company?.verificationStatus;

        // Bước 3: Legal verification
        const legalVerified = company?.legalVerificationStatus === 'approved';

        // Tất cả 3 bước phải hoàn thành
        const isVerified = emailVerified && companyVerified && legalVerified;
        
        this.isVerifiedSubject.next(isVerified);
        console.log('[NavigationService] Verification status loaded:', {
          emailVerified,
          companyVerified,
          legalVerified,
          isVerified
        });
      },
      error: (error) => {
        console.error('[NavigationService] Error loading full verification status:', error);
        this.isVerifiedSubject.next(false);
      }
    });
  }

  // Update auth state based on route context (call this when route changes)
  updateAuthStateFromRoute() {
    // Chỉ update từ user hiện có trong AuthStateService
    const currentUser = this.authStateService.user;
    this.updateAuthStateFromUser(currentUser);
    
    // Reload verification status khi route changes để đảm bảo data luôn được cập nhật
    const currentRole = this.getCurrentRole();
    if (currentRole === 'recruiter') {
      setTimeout(() => {
        this.reloadVerificationStatus();
      }, 300);
    }
  }

  // Đăng nhập candidate
  loginAsCandidate() {
    // Wait for user to be set in AuthStateService by login flow
    const currentUser = this.authStateService.user;
    if (currentUser) {
      this.updateAuthStateFromUser(currentUser);
      return;
    }
    
    // Wait a bit for user to be loaded
    setTimeout(() => {
      const userAfterDelay = this.authStateService.user;
      if (userAfterDelay) {
        this.updateAuthStateFromUser(userAfterDelay);
      } else {
          this.isLoggedInSubject.next(true);
          this.userRoleSubject.next('candidate');
          this.isVerifiedSubject.next(false);
      }
    }, 100);
  }

  // Đăng nhập recruiter
  loginAsRecruiter() {
    // Wait for user to be set - tăng delay để đảm bảo user data đã được load đầy đủ
    setTimeout(() => {
      const user = this.authStateService.user;
      if (user) {
        this.updateAuthStateFromUser(user);
        
        // Reload verification status sau một khoảng thời gian để đảm bảo backend data đã được refresh
        setTimeout(() => {
          this.reloadVerificationStatus();
        }, 500);
        
        const isVerified = this.isVerified();
        if (!isVerified) {
          this.router.navigate(['/recruiter/recruiter-verify']);
        } else {
          this.router.navigate(['/recruiter/home']);
        }
      } else {
        console.warn('[NavigationService] User not loaded, setting default recruiter state');
          this.isLoggedInSubject.next(true);
          this.userRoleSubject.next('recruiter');
          this.isVerifiedSubject.next(false);
        this.router.navigate(['/recruiter/recruiter-verify']);
      }
    }, 300);
  }

  // Đăng nhập recruiter mà không redirect đến verify (dùng cho HR Staff)
  loginAsRecruiterWithoutVerify() {
    
    setTimeout(() => {
      const user = this.authStateService.user;
      if (user) {
        this.updateAuthStateFromUser(user);
      } else {
          this.isLoggedInSubject.next(true);
          this.userRoleSubject.next('recruiter');
          this.isVerifiedSubject.next(false);
      }
      this.router.navigate(['/recruiter/recruiter-setting']);
    }, 100);
  }

  // Đăng xuất
  logout() {
    const currentRole = this.getCurrentRole();
    
    // Clear auth state
    this.clearAuthState();
    
    // Clear cookies client-side
    // Lưu ý: Remember me cookie sẽ được giữ lại để điền username/password vào form login
    // Nhưng session cookie sẽ bị xóa để logout hoàn toàn
    this.clearAuthCookies();
    
    // Call API logout
    this.authFacadeService.logout().subscribe({
      next: () => {
        this.redirectAfterLogout(currentRole);
      },
      error: (err) => {
        this.redirectAfterLogout(currentRole);
      }
    });
  }
  
  private redirectAfterLogout(role: UserRole) {
    if (role === 'candidate') {
          this.router.navigate(['/']);
    } else if (role === 'recruiter') {
          this.router.navigate(['/recruiter/about-us']);
        } else {
          this.router.navigate(['/']);
        }
  }
  
  // Xóa tất cả cookies liên quan đến authentication
  // Lưu ý: KHÔNG xóa remember me cookie (candidate_remember) để giữ lại username/password
  private clearAuthCookies() {
    const cookies = [
      'access_token',
      'refresh_token',
      'XSRF-TOKEN',
      '.AspNetCore.Identity.Application',
      '.AspNetCore.Antiforgery'
    ];
    
    cookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    // KHÔNG xóa remember cookies (candidate_remember, recruiter_remember) - giữ lại để điền email/password vào form login
  }

  // Kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Lấy role hiện tại
  getCurrentRole(): UserRole {
    // Check subject first
    if (this.userRoleSubject.value) {
      return this.userRoleSubject.value;
    }
    
    // Fallback to check user from AuthStateService
    const user = this.authStateService.user;
    if (user && user.roles) {
      const rolesLowerCase = user.roles.map((r: string) => r.toLowerCase());
      if (rolesLowerCase.some((r: string) => r.includes('recruiter') || r === 'hr_staff')) {
        return 'recruiter';
      } else if (rolesLowerCase.includes('candidate')) {
        return 'candidate';
      }
    }
    
    return null;
  }

  // Kiểm tra verification status (chỉ cho recruiter)
  isVerified(): boolean {
    return this.isVerifiedSubject.value;
  }

  // Set verification status (chỉ cho recruiter)
  setVerified(verified: boolean) {
    this.isVerifiedSubject.next(verified);
  }

  // Navigate dựa trên role
  navigateBasedOnRole() {
    const role = this.getCurrentRole();
    if (role === 'candidate') {
      this.router.navigate(['/jobs']);
    } else if (role === 'recruiter') {
      const isVerified = this.isVerified();
      if (!isVerified) {
        this.router.navigate(['/recruiter/recruiter-verify']);
      } else {
        this.router.navigate(['/recruiter/home']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  // Token methods - no-op với cookies
  setAccessToken(token: string, role: UserRole) {}
  getAccessToken(role?: UserRole): string | null { return null; }
  setRefreshToken(token: string, role: UserRole) {}
  getRefreshToken(role?: UserRole): string | null { return null; }
}