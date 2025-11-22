import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
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
    // Khôi phục trạng thái từ cookies khi khởi tạo
    this.initializeAuthState();
    
    // Subscribe vào user changes để cập nhật trạng thái
    this.authStateService.user$.subscribe(user => {
      this.updateAuthStateFromUser(user);
    });
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
        // Không có cookies hoặc cookies không hợp lệ, set trạng thái chưa đăng nhập
        this.isLoggedInSubject.next(false);
        this.userRoleSubject.next(null);
        this.isVerifiedSubject.next(false);
      }
    });
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
    
    if (roles.includes('recruiter') || roles.includes('hr_staff')) {
      userRole = 'recruiter';
    } else if (roles.includes('candidate')) {
      userRole = 'candidate';
    }

    // Cập nhật trạng thái
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next(userRole);
    
    // Verification chỉ áp dụng cho recruiter (có thể check thêm logic nếu cần)
    this.isVerifiedSubject.next(false); // Có thể cần logic khác để check verification
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
        }
      }
    });
  }

  // Đăng nhập recruiter
  // Với cookies, không cần lưu vào localStorage
  // Chỉ cần load current user để cập nhật state
  loginAsRecruiter() {
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
        }
      }
    });
  }

  // Đăng nhập recruiter mà không redirect đến verify (dùng cho HR Staff)
  loginAsRecruiterWithoutVerify() {
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
        }
        this.router.navigate(['/recruiter/recruiter-setting']);
      }
    });
  }

  // Đăng xuất - với cookies, gọi API logout để xóa cookies ở backend
  logout() {
    const currentRole = this.getCurrentRole();
    
    // Gọi API logout để xóa cookies
    this.authFacadeService.logout().subscribe({
      next: () => {
        // Update subjects
        this.isLoggedInSubject.next(false);
        this.userRoleSubject.next(null);
        this.isVerifiedSubject.next(false);
        
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
        // Ngay cả khi API logout fail, vẫn clear state và redirect
        this.isLoggedInSubject.next(false);
        this.userRoleSubject.next(null);
        this.isVerifiedSubject.next(false);
        
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
      if (user.roles.includes('recruiter') || user.roles.includes('hr_staff')) {
        return 'recruiter';
      } else if (user.roles.includes('candidate')) {
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
