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
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userRole = localStorage.getItem('userRole') as UserRole;
    const isVerified = localStorage.getItem('isVerified') === 'true';
    
    if (isLoggedIn && userRole) {
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next(userRole);
      this.isVerifiedSubject.next(isVerified);
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
    // Sau khi đăng xuất, redirect về trang chủ
    this.router.navigate(['/']);
  }

  // Kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
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
