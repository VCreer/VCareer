import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
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
  private authStateInitialized = false; // Flag để tránh gọi API nhiều lần
  
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public userRole$ = this.userRoleSubject.asObservable();
  public isVerified$ = this.isVerifiedSubject.asObservable();

  constructor(
    private router: Router,
    private authStateService: AuthStateService,
    private authFacadeService: AuthFacadeService
  ) {
    // Khôi phục trạng thái từ cookies khi khởi tạo - chỉ khi vào route yêu cầu auth
    this.initializeAuthStateIfNeeded();
    
    // Subscribe vào user changes để cập nhật trạng thái
    this.authStateService.user$.subscribe(user => {
      this.updateAuthStateFromUser(user);
    });
    
    // Subscribe vào route changes để load auth state khi cần
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.initializeAuthStateIfNeeded();
      });
  }
  
  private initializeAuthStateIfNeeded() {
    const currentUrl = this.router.url;
    
    // Danh sách các route public không cần auth
    const publicRoutes = [
      '/',
      '/home',
      '/candidate/about-us',
      '/candidate/contact',
      '/candidate/job',
      '/candidate/company',
      '/recruiter/about-us',
      '/recruiter/service',
      '/candidate/login',
      '/candidate/register',
      '/recruiter/login',
      '/recruiter/register',
      '/employee/login',
      '/common/forgot-password',
      '/common/reset-password'
    ];
    
    // Nếu đang ở route public, không tự động load user
    const isPublicRoute = publicRoutes.some(route => 
      currentUrl === route || currentUrl.startsWith(route + '?')
    );
    
    if (isPublicRoute) {
      // Với route public, verify cookies bằng cách gọi API một lần
      // Chỉ gọi API nếu chưa được initialize
      if (!this.authStateInitialized) {
        this.authFacadeService.loadCurrentUser().subscribe({
          next: (user) => {
            // Có cookies hợp lệ, cập nhật state
            this.updateAuthStateFromUser(user);
            this.authStateInitialized = true;
          },
          error: (err) => {
            // Không có cookies hoặc cookies không hợp lệ
            // Clear state và cookies
            this.clearAuthState();
            this.clearAuthCookies();
            this.authStateInitialized = true;
          }
        });
      }
      return;
    }
    
    // Với route yêu cầu auth, load user từ cookies
    this.initializeAuthState();
  }
  
  // Clear auth state
  private clearAuthState() {
    this.isLoggedInSubject.next(false);
    this.userRoleSubject.next(null);
    this.isVerifiedSubject.next(false);
    this.authStateService.setUser(null);
  }

  private initializeAuthState() {
    // Kiểm tra trạng thái đăng nhập từ cookies bằng cách gọi API getCurrentUser
    // Nếu có cookies hợp lệ, API sẽ trả về user info
    this.authFacadeService.loadCurrentUser().subscribe({
      next: (user) => {
        // Có user từ cookies, cập nhật trạng thái
        this.updateAuthStateFromUser(user);
      },
      error: (err) => {
        // Không có cookies hoặc cookies không hợp lệ
        // Clear state và cookies
        this.clearAuthState();
        this.clearAuthCookies();
      }
    });
  }

  private updateAuthStateFromUser(user: any) {
    console.log('[NavigationService] updateAuthStateFromUser called with user:', user);
    
    if (!user) {
      console.log('[NavigationService] No user, setting logged out state');
      this.isLoggedInSubject.next(false);
      this.userRoleSubject.next(null);
      this.isVerifiedSubject.next(false);
      this.authStateInitialized = true; // Đã verify rồi
      return;
    }

    // Xác định role dựa vào roles array
    const roles = user.roles || [];
    console.log('[NavigationService] User roles:', roles);
    console.log('[NavigationService] Roles type:', typeof roles, 'isArray:', Array.isArray(roles));
    
    let userRole: UserRole = null;
    
    // Convert roles to lowercase để so sánh
    const rolesLowerCase = roles.map((r: string) => r.toLowerCase());
    console.log('[NavigationService] Roles lowercase:', rolesLowerCase);
    
    // Check cho recruiter: recruiter, hr_staff, lead_recruiter, LEAD_RECRUITER, etc.
    if (rolesLowerCase.some((r: string) => r.includes('recruiter') || r === 'hr_staff')) {
      userRole = 'recruiter';
      console.log('[NavigationService] Setting role to recruiter');
    } else if (rolesLowerCase.includes('candidate')) {
      userRole = 'candidate';
      console.log('[NavigationService] Setting role to candidate');
    } else {
      console.log('[NavigationService] No matching role found, role will be null');
    }

    console.log('[NavigationService] Final userRole:', userRole);

    // Cập nhật trạng thái đăng nhập + role
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next(userRole);
    this.authStateInitialized = true; // Đã load user thành công

    // ---- Cập nhật trạng thái xác thực recruiter ----
    // TODO: Khi backend trả về RecruiterLevel hoặc cờ đã xác thực trong user,
    // hãy thay thế logic tạm thời này bằng dữ liệu thật từ API.
    // Hiện tại: giữ nguyên trạng thái isVerified hiện tại, không reset về false mỗi lần load user,
    // để tránh sidebar bị "Chưa xác thực" khi chuyển route.
    if (userRole !== 'recruiter') {
      // Chỉ áp dụng verification cho recruiter, các role khác luôn false
      this.isVerifiedSubject.next(false);
    }
  }

  // Update auth state based on route context (call this when route changes)
  updateAuthStateFromRoute() {
    // Với cookies, chỉ cần reload user từ API
    this.authFacadeService.loadCurrentUser().subscribe({
      next: (user) => {
        this.updateAuthStateFromUser(user);
      },
      error: (err) => {
        // Không có cookies hợp lệ
        this.isLoggedInSubject.next(false);
        this.userRoleSubject.next(null);
        this.isVerifiedSubject.next(false);
      }
    });
  }

  // Đăng nhập candidate
  // Với cookies, không cần lưu vào localStorage
  // Chỉ cần load current user để cập nhật state
  loginAsCandidate() {
    this.authStateInitialized = false; // Reset flag để load lại
    this.authFacadeService.loadCurrentUser().subscribe({
      next: (user) => {
        this.updateAuthStateFromUser(user);
      },
      error: (err) => {
        // Nếu không load được, vẫn set state dựa vào route
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/recruiter')) {
          this.isLoggedInSubject.next(true);
          this.userRoleSubject.next('candidate');
          this.isVerifiedSubject.next(false);
          this.authStateInitialized = true;
        }
      }
    });
  }

  // Đăng nhập recruiter
  // Với cookies, không cần lưu vào localStorage
  // Chỉ cần load current user để cập nhật state
  loginAsRecruiter() {
    this.authStateInitialized = false; // Reset flag để load lại
    this.authFacadeService.loadCurrentUser().subscribe({
      next: (user) => {
        this.updateAuthStateFromUser(user);
        
        // Kiểm tra verification status và redirect
        const isVerified = this.isVerified();
        if (!isVerified) {
          this.router.navigate(['/recruiter/recruiter-verify']);
        } else {
          this.router.navigate(['/recruiter/home']);
        }
      },
      error: (err) => {
        // Nếu không load được, vẫn set state dựa vào route
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/recruiter')) {
          this.isLoggedInSubject.next(true);
          this.userRoleSubject.next('recruiter');
          this.isVerifiedSubject.next(false);
          this.authStateInitialized = true;
        }
      }
    });
  }

  // Đăng nhập recruiter mà không redirect đến verify (dùng cho HR Staff)
  loginAsRecruiterWithoutVerify() {
    this.authStateInitialized = false; // Reset flag để load lại
    this.authFacadeService.loadCurrentUser().subscribe({
      next: (user) => {
        this.updateAuthStateFromUser(user);
        // HR Staff không cần verify, luôn redirect đến trang recruiter-setting
        this.router.navigate(['/recruiter/recruiter-setting']);
      },
      error: (err) => {
        // Nếu không load được, vẫn set state và redirect
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/recruiter')) {
          this.isLoggedInSubject.next(true);
          this.userRoleSubject.next('recruiter');
          this.isVerifiedSubject.next(false);
          this.authStateInitialized = true;
        }
        this.router.navigate(['/recruiter/recruiter-setting']);
      }
    });
  }

  // Đăng xuất - với cookies, gọi API logout để xóa cookies ở backend
  logout() {
    const currentRole = this.getCurrentRole();
    
    // Clear auth state trước khi gọi API
    this.isLoggedInSubject.next(false);
    this.userRoleSubject.next(null);
    this.isVerifiedSubject.next(false);
    this.authStateInitialized = false; // Reset flag để có thể load lại sau khi đăng nhập
    
    // Clear cookies client-side để đảm bảo logout hoàn toàn
    this.clearAuthCookies();
    
    // Gọi API logout để xóa cookies ở backend
    this.authFacadeService.logout().subscribe({
      next: () => {
        // Redirect dựa vào role
        if (currentRole === 'candidate') {
          this.router.navigate(['/']);
        } else if (currentRole === 'recruiter') {
          this.router.navigate(['/recruiter/about-us']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Ngay cả khi API logout fail, vẫn redirect
        if (currentRole === 'candidate') {
          this.router.navigate(['/']);
        } else if (currentRole === 'recruiter') {
          this.router.navigate(['/recruiter/about-us']);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
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
      // Xóa cookie với path /
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Xóa cookie với path domain hiện tại
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
  }

  // Kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Lấy role hiện tại - check từ user trong AuthStateService
  getCurrentRole(): UserRole {
    // First check subject (for reactive updates)
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
  // Với cookies, có thể cần check từ user info hoặc API khác
  isVerified(): boolean {
    return this.isVerifiedSubject.value;
  }

  // Set verification status (chỉ cho recruiter)
  setVerified(verified: boolean) {
    this.isVerifiedSubject.next(verified);
    // Với cookies, không cần lưu vào localStorage
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

  // Với cookies, không cần lưu/đọc token ở frontend
  // Tokens được quản lý bởi backend thông qua cookies
  // Giữ lại methods này để tương thích với code cũ, nhưng không làm gì
  setAccessToken(token: string, role: UserRole) {
    // Với cookies, không cần lưu token
  }

  getAccessToken(role?: UserRole): string | null {
    // Với cookies, token được gửi tự động trong cookies
    return null;
  }

  setRefreshToken(token: string, role: UserRole) {
    // Với cookies, không cần lưu token
  }

  getRefreshToken(role?: UserRole): string | null {
    // Với cookies, token được gửi tự động trong cookies
    return null;
  }
}
