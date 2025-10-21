import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomAuthService {
  constructor(
    private router: Router
  ) {}

  // Chuyển hướng đến trang đăng nhập tùy chỉnh
  navigateToLogin() {
    this.router.navigate(['/account/login']);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Xử lý đăng nhập (Mock - chỉ hiển thị UI)
  login(credentials: { username: string, password: string, rememberMe: boolean }): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        // Mock success - chỉ để test UI
        observer.next({
          isSuccess: true,
          data: { user: credentials.username }
        });
        observer.complete();
      }, 1000);
    });
  }

  // Xử lý đăng ký (Mock - chỉ hiển thị UI)
  register(userData: { firstName: string, lastName: string, email: string, username: string, password: string, termsAgreement: boolean }): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        // Mock success - chỉ để test UI
        observer.next({
          isSuccess: true,
          data: { user: userData.username }
        });
        observer.complete();
      }, 1000);
    });
  }

  // Đăng xuất
  logout() {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('justLoggedIn');
    this.router.navigate(['/']);
    return of(true);
  }

  // Lấy thông tin user hiện tại
  getCurrentUser() {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Lấy access token
  getAccessToken() {
    // TODO: Implement real token management
    return null;
  }

  // Refresh token
  refreshToken() {
    // TODO: Implement real token refresh
    return of(null);
  }
}