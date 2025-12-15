import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthStateService } from './auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from './auth-Cookiebased/auth-facade.service';

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
    private authFacadeService: AuthFacadeService
  ) {
    console.log('[NavigationService] Constructor');
    
    // CRITICAL: Subscribe vào user changes từ AuthStateService
    // APP_INITIALIZER đã load user rồi, chỉ cần lắng nghe thay đổi
    this.authStateService.user$.subscribe(user => {
      console.log('[NavigationService] User changed in authStateService:', user);
      this.updateAuthStateFromUser(user);
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
      // Đối với recruiter, cần kiểm tra verification status
      // Nếu user có property verificationStatus, sử dụng nó
      // Nếu không, giữ nguyên giá trị hiện tại (không reset về false)
      const verificationStatus = (user as any)?.verificationStatus;
      if (verificationStatus !== undefined) {
        this.isVerifiedSubject.next(verificationStatus);
      }
      // Nếu không có verificationStatus trong user, giữ nguyên giá trị hiện tại
    }
  }

  // Update auth state based on route context (call this when route changes)
  updateAuthStateFromRoute() {
    // Chỉ update từ user hiện có trong AuthStateService
    const currentUser = this.authStateService.user;
    this.updateAuthStateFromUser(currentUser);
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
    // Wait for user to be set
    setTimeout(() => {
      const user = this.authStateService.user;
      if (user) {
        this.updateAuthStateFromUser(user);
        
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
    }, 100);
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