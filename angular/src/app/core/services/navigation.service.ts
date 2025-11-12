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

  constructor(private router: Router) {
    // Khôi phục trạng thái từ localStorage khi khởi tạo
    this.initializeAuthState();
  }

  private initializeAuthState() {
    // Kiểm tra token từ localStorage hoặc sessionStorage
    const accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userRole = localStorage.getItem('userRole') as UserRole;
    const isVerified = localStorage.getItem('isVerified') === 'true';
    
    console.log('[NavigationService] initializeAuthState:', {
      hasToken: !!accessToken,
      isLoggedIn,
      userRole,
      isVerified,
      tokenSource: accessToken ? (localStorage.getItem('access_token') ? 'localStorage' : 'sessionStorage') : 'none'
    });
    
    // Nếu có token, coi như đã đăng nhập (khôi phục trạng thái từ token)
    if (accessToken) {
      // Nếu có token nhưng chưa có isLoggedIn, khôi phục từ token
      if (!isLoggedIn || !userRole) {
        console.log('[NavigationService] Restoring auth state from token');
        // Mặc định là candidate nếu có token nhưng không có role
        // Hoặc có thể lấy từ token (nếu token có chứa role) - TODO: decode token để lấy role
        const defaultRole: UserRole = userRole || 'candidate'; // Ưu tiên role có sẵn, nếu không thì mặc định candidate
        this.isLoggedInSubject.next(true);
        this.userRoleSubject.next(defaultRole);
        localStorage.setItem('isLoggedIn', 'true');
        if (!userRole) {
          localStorage.setItem('userRole', defaultRole);
        }
        if (isVerified) {
          this.isVerifiedSubject.next(isVerified);
        }
      } else {
        // Đã có đầy đủ thông tin, khôi phục trạng thái
        this.isLoggedInSubject.next(true);
        this.userRoleSubject.next(userRole);
        this.isVerifiedSubject.next(isVerified);
      }
    } else if (isLoggedIn && userRole) {
      // Nếu không có token nhưng có isLoggedIn, vẫn giữ trạng thái (trường hợp đặc biệt)
      console.log('[NavigationService] Restoring auth state from localStorage (no token)');
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next(userRole);
      this.isVerifiedSubject.next(isVerified);
    } else {
      console.log('[NavigationService] No auth state found, user is not logged in');
    }
  }

  // Đăng nhập candidate
  loginAsCandidate() {
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next('candidate');
    // Lưu trạng thái vào localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'candidate');
    // Không navigate tự động, để component tự quyết định
  }

  // Đăng nhập recruiter
  loginAsRecruiter() {
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next('recruiter');
    // Lưu trạng thái vào localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'recruiter');
    
    // Kiểm tra verification status
    const isVerified = this.isVerified();
    this.isVerifiedSubject.next(isVerified);
    
    // Nếu chưa verify, redirect đến trang verify, ngược lại redirect đến home
    if (!isVerified) {
      this.router.navigate(['/recruiter/recruiter-verify']);
    } else {
      this.router.navigate(['/recruiter/home']);
    }
  }

  // Đăng xuất
  logout() {
    this.isLoggedInSubject.next(false);
    this.userRoleSubject.next(null);
    this.isVerifiedSubject.next(false);
    // Xóa trạng thái khỏi localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isVerified');
    // Xóa token ở cả localStorage và sessionStorage
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch {}
    try {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    } catch {}
    // Sau khi đăng xuất, redirect về trang chủ
    this.router.navigate(['/']);
  }

  // Kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    // Kiểm tra cả token và trạng thái
    const hasToken = !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
    const stateLoggedIn = this.isLoggedInSubject.value;
    
    // Nếu có token, coi như đã đăng nhập (ngay cả khi state chưa được set)
    // State sẽ được set khi initializeAuthState() được gọi
    if (hasToken) {
      return true;
    }
    
    return stateLoggedIn;
  }
  
  // Kiểm tra xem có token không
  hasToken(): boolean {
    return !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
  }

  // Lấy role hiện tại
  getCurrentRole(): UserRole {
    return this.userRoleSubject.value;
  }

  // Kiểm tra verification status
  isVerified(): boolean {
    const verified = localStorage.getItem('isVerified');
    return verified === 'true';
  }

  // Set verification status
  setVerified(verified: boolean) {
    this.isVerifiedSubject.next(verified);
    localStorage.setItem('isVerified', verified ? 'true' : 'false');
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
}
