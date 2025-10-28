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
  
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public userRole$ = this.userRoleSubject.asObservable();

  constructor(private router: Router) {
    // Khôi phục trạng thái từ localStorage khi khởi tạo
    this.initializeAuthState();
  }

  private initializeAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userRole = localStorage.getItem('userRole') as UserRole;
    
    if (isLoggedIn && userRole) {
      this.isLoggedInSubject.next(true);
      this.userRoleSubject.next(userRole);
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
    // Sau khi đăng nhập, redirect đến /recruiter
    this.router.navigate(['/recruiter']);
  }

  // Đăng xuất
  logout() {
    this.isLoggedInSubject.next(false);
    this.userRoleSubject.next(null);
    // Xóa trạng thái khỏi localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
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

  // Navigate dựa trên role
  navigateBasedOnRole() {
    const role = this.getCurrentRole();
    if (role === 'candidate') {
      this.router.navigate(['/jobs']);
    } else if (role === 'recruiter') {
      this.router.navigate(['/recruiter']);
    } else {
      this.router.navigate(['/']);
    }
  }
}