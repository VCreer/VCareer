import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

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

  // Storage keys with role prefix to separate candidate and recruiter
  private readonly CANDIDATE_KEYS = {
    isLoggedIn: 'candidate_isLoggedIn',
    userRole: 'candidate_userRole',
    accessToken: 'candidate_access_token',
    refreshToken: 'candidate_refresh_token'
  };

  private readonly RECRUITER_KEYS = {
    isLoggedIn: 'recruiter_isLoggedIn',
    userRole: 'recruiter_userRole',
    isVerified: 'recruiter_isVerified',
    accessToken: 'recruiter_access_token',
    refreshToken: 'recruiter_refresh_token'
  };

  constructor(private router: Router) {
    // Khôi phục trạng thái từ localStorage khi khởi tạo
    this.initializeAuthState();
  }

  private initializeAuthState() {
    // Check candidate and recruiter login status
    const candidateLoggedIn = localStorage.getItem(this.CANDIDATE_KEYS.isLoggedIn) === 'true';
    const recruiterLoggedIn = localStorage.getItem(this.RECRUITER_KEYS.isLoggedIn) === 'true';
    
    // Determine role based on current route if both are logged in
    // Otherwise, use whichever is logged in
    if (candidateLoggedIn && recruiterLoggedIn) {
      // Both logged in - determine by route
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/recruiter')) {
        this.isLoggedInSubject.next(true);
        this.userRoleSubject.next('recruiter');
        const isVerified = localStorage.getItem(this.RECRUITER_KEYS.isVerified) === 'true';
        this.isVerifiedSubject.next(isVerified);
      } else {
        this.isLoggedInSubject.next(true);
        this.userRoleSubject.next('candidate');
        this.isVerifiedSubject.next(false);
      }
    } else if (candidateLoggedIn) {
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next('candidate');
      this.isVerifiedSubject.next(false); // Candidate doesn't have verification
    } else if (recruiterLoggedIn) {
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next('recruiter');
      const isVerified = localStorage.getItem(this.RECRUITER_KEYS.isVerified) === 'true';
      this.isVerifiedSubject.next(isVerified);
    }
  }

  // Update auth state based on route context (call this when route changes)
  updateAuthStateFromRoute() {
    const currentPath = window.location.pathname;
    const candidateLoggedIn = localStorage.getItem(this.CANDIDATE_KEYS.isLoggedIn) === 'true';
    const recruiterLoggedIn = localStorage.getItem(this.RECRUITER_KEYS.isLoggedIn) === 'true';
    
    if (currentPath.startsWith('/recruiter') && recruiterLoggedIn) {
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next('recruiter');
      const isVerified = localStorage.getItem(this.RECRUITER_KEYS.isVerified) === 'true';
      this.isVerifiedSubject.next(isVerified);
    } else if (!currentPath.startsWith('/recruiter') && candidateLoggedIn) {
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next('candidate');
      this.isVerifiedSubject.next(false);
    }
  }

  // Đăng nhập candidate
loginAsCandidate() {
  this.isLoggedInSubject.next(true);
  this.userRoleSubject.next('candidate');
  this.isVerifiedSubject.next(false);
  }

  // Đăng nhập recruiter
  loginAsRecruiter() {
   // this.isLoggedInSubject.next(true);
   // this.userRoleSubject.next('recruiter');
    
    // Lưu trạng thái vào localStorage với prefix recruiter
  //  localStorage.setItem(this.RECRUITER_KEYS.isLoggedIn, 'true');
   // localStorage.setItem(this.RECRUITER_KEYS.userRole, 'recruiter');
    
    // Kiểm tra verification status
    // const isVerified = this.isVerified();
    // this.isVerifiedSubject.next(isVerified);
    
    // Nếu chưa verify, redirect đến trang verify, ngược lại redirect đến home
    // if (!isVerified) {
    //   this.router.navigate(['/recruiter/recruiter-verify']);
    // } else {
    //   this.router.navigate(['/recruiter/home']);
    // }
  }

  // Đăng xuất - chỉ xóa keys của role hiện tại
  logout() {
    const currentRole = this.getCurrentRole();
    
    if (currentRole === 'candidate') {
      // Xóa candidate keys
      localStorage.removeItem(this.CANDIDATE_KEYS.isLoggedIn);
      localStorage.removeItem(this.CANDIDATE_KEYS.userRole);
      localStorage.removeItem(this.CANDIDATE_KEYS.accessToken);
      localStorage.removeItem(this.CANDIDATE_KEYS.refreshToken);
      
      // Update subjects
      this.isLoggedInSubject.next(false);
      this.userRoleSubject.next(null);
      this.isVerifiedSubject.next(false);
      
      // Redirect về trang chủ
      this.router.navigate(['/']);
    } else if (currentRole === 'recruiter') {
      // Xóa recruiter keys
      localStorage.removeItem(this.RECRUITER_KEYS.isLoggedIn);
      localStorage.removeItem(this.RECRUITER_KEYS.userRole);
      localStorage.removeItem(this.RECRUITER_KEYS.isVerified);
      localStorage.removeItem(this.RECRUITER_KEYS.accessToken);
      localStorage.removeItem(this.RECRUITER_KEYS.refreshToken);
      
      // Update subjects
      this.isLoggedInSubject.next(false);
      this.userRoleSubject.next(null);
      this.isVerifiedSubject.next(false);
      
      // Redirect về trang recruiter about-us
      this.router.navigate(['/recruiter/about-us']);
    }
    
    // Clean up old shared keys if they exist (for backward compatibility)
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isVerified');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Lấy role hiện tại - check cả candidate và recruiter
  getCurrentRole(): UserRole {
    // First check subject (for reactive updates)
    if (this.userRoleSubject.value) {
      return this.userRoleSubject.value;
    }
    
    // Fallback to localStorage check
    const candidateLoggedIn = localStorage.getItem(this.CANDIDATE_KEYS.isLoggedIn) === 'true';
    const recruiterLoggedIn = localStorage.getItem(this.RECRUITER_KEYS.isLoggedIn) === 'true';
    
    if (candidateLoggedIn) {
      return 'candidate';
    } else if (recruiterLoggedIn) {
      return 'recruiter';
    }
    
    return null;
  }

  // Kiểm tra verification status (chỉ cho recruiter)
  isVerified(): boolean {
    const verified = localStorage.getItem(this.RECRUITER_KEYS.isVerified);
    return verified === 'true';
  }

  // Set verification status (chỉ cho recruiter)
  setVerified(verified: boolean) {
    this.isVerifiedSubject.next(verified);
    localStorage.setItem(this.RECRUITER_KEYS.isVerified, verified ? 'true' : 'false');
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

  // Helper methods để lưu/đọc token theo role
  setAccessToken(token: string, role: UserRole) {
    if (role === 'candidate') {
      localStorage.setItem(this.CANDIDATE_KEYS.accessToken, token);
    } else if (role === 'recruiter') {
      localStorage.setItem(this.RECRUITER_KEYS.accessToken, token);
    }
  }

  getAccessToken(role?: UserRole): string | null {
    const targetRole = role || this.getCurrentRole();
    if (targetRole === 'candidate') {
      return localStorage.getItem(this.CANDIDATE_KEYS.accessToken);
    } else if (targetRole === 'recruiter') {
      return localStorage.getItem(this.RECRUITER_KEYS.accessToken);
    }
    return null;
  }

  setRefreshToken(token: string, role: UserRole) {
    if (role === 'candidate') {
      localStorage.setItem(this.CANDIDATE_KEYS.refreshToken, token);
    } else if (role === 'recruiter') {
      localStorage.setItem(this.RECRUITER_KEYS.refreshToken, token);
    }
  }

  getRefreshToken(role?: UserRole): string | null {
    const targetRole = role || this.getCurrentRole();
    if (targetRole === 'candidate') {
      return localStorage.getItem(this.CANDIDATE_KEYS.refreshToken);
    } else if (targetRole === 'recruiter') {
      return localStorage.getItem(this.RECRUITER_KEYS.refreshToken);
    }
    return null;
  }
}
