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

  constructor(private router: Router) {}

  // Đăng nhập candidate
  loginAsCandidate() {
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next('candidate');
    // Không navigate tự động, để component tự quyết định
  }

  // Đăng nhập recruiter
  loginAsRecruiter() {
    this.isLoggedInSubject.next(true);
    this.userRoleSubject.next('recruiter');
    // Sau khi đăng nhập, redirect đến /recruiter
    this.router.navigate(['/recruiter']);
  }

  // Đăng xuất
  logout() {
    this.isLoggedInSubject.next(false);
    this.userRoleSubject.next(null);
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