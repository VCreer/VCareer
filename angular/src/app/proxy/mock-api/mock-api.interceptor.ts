import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Mock API Interceptor - Xử lý các request giả lập cho testing
 * Chỉ tập trung vào Authentication
 */
@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  constructor() {}

  /**
   * Intercept HTTP requests và xử lý mock API calls
   * @param req - HTTP request
   * @param next - Next handler
   * @returns Observable của HTTP event
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Chỉ xử lý các request có chứa '/api/mock/'
    if (req.url.includes('/api/mock/')) {
      return this.handleMockRequest(req);
    }

    // Các request khác sẽ đi qua bình thường
    return next.handle(req);
  }

  /**
   * Xử lý các mock request dựa trên URL và method
   * @param req - HTTP request
   * @returns Observable của mock response
   */
  private handleMockRequest(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const url = req.url;
    const method = req.method;
    const body = req.body;

    // === AUTHENTICATION ENDPOINTS ===
    // Đăng nhập
    if (url.includes('/auth/login') && method === 'POST') {
      return this.mockLogin(body);
    }

    // Đăng ký
    if (url.includes('/auth/register') && method === 'POST') {
      return this.mockRegister(body);
    }

    // Đăng xuất
    if (url.includes('/auth/logout') && method === 'POST') {
      return this.mockLogout();
    }

    // Lấy thông tin user hiện tại
    if (url.includes('/auth/me') && method === 'GET') {
      return this.mockGetCurrentUser();
    }

    // Dữ liệu cần authentication
    if (url.includes('/api/protected') && method === 'GET') {
      return this.mockGetProtectedData();
    }

    // Trả về 404 nếu không tìm thấy endpoint
    return of(new HttpResponse({
      status: 404,
      body: { error: 'Mock endpoint not found' }
    })).pipe(delay(100));
  }

  // === MOCK AUTHENTICATION METHODS ===
  
  /**
   * Mock đăng nhập - Kiểm tra credentials và trả về token
   * @param credentials - Thông tin đăng nhập {username, password}
   * @returns Observable của login response
   */
  private mockLogin(credentials: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { username, password } = credentials;
        
        // Kiểm tra admin credentials
        if (username === 'admin' && password === 'admin123') {
          const token = 'mock_token_admin_' + Date.now();
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              token: token,
              user: {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
              }
            }
          }));
        } 
        // Kiểm tra user credentials
        else if (username === 'user' && password === 'user123') {
          const token = 'mock_token_user_' + Date.now();
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              token: token,
              user: {
                id: 2,
                username: 'user',
                email: 'user@example.com',
                firstName: 'Regular',
                lastName: 'User',
                role: 'user'
              }
            }
          }));
        } 
        // Credentials không hợp lệ
        else {
          observer.next(new HttpResponse({
            status: 401,
            body: {
              success: false,
              message: 'Invalid credentials'
            }
          }));
        }
        observer.complete();
      }, 1000); // Simulate network delay
    });
  }

  /**
   * Mock đăng ký - Tạo user mới và trả về token
   * @param userData - Thông tin user mới
   * @returns Observable của register response
   */
  private mockRegister(userData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = 'mock_token_' + userData.username + '_' + Date.now();
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            token: token,
            user: {
              id: Date.now(),
              username: userData.username,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: 'user' // Mặc định role là user
            }
          }
        }));
        observer.complete();
      }, 1500); // Simulate network delay
    });
  }

  /**
   * Mock đăng xuất - Xóa authentication
   * @returns Observable của logout response
   */
  private mockLogout(): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            message: 'Logged out successfully'
          }
        }));
        observer.complete();
      }, 500);
    });
  }

  /**
   * Mock lấy thông tin user hiện tại - Kiểm tra authentication
   * @returns Observable của current user response
   */
  private mockGetCurrentUser(): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        // Kiểm tra token trong localStorage (simplified check)
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Trả về thông tin user (mock data)
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              data: {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
              }
            }
          }));
        } else {
          // Không có token - Unauthorized
          observer.next(new HttpResponse({
            status: 401,
            body: {
              success: false,
              message: 'Unauthorized'
            }
          }));
        }
        observer.complete();
      }, 300);
    });
  }

  /**
   * Mock dữ liệu cần authentication - Kiểm tra token trước khi trả về data
   * @returns Observable của protected data response
   */
  private mockGetProtectedData(): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Có token - trả về protected data
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              data: {
                message: 'This is protected data',
                timestamp: new Date().toISOString(),
                user: 'admin'
              }
            }
          }));
        } else {
          // Không có token - Unauthorized
          observer.next(new HttpResponse({
            status: 401,
            body: {
              success: false,
              message: 'Unauthorized'
            }
          }));
        }
        observer.complete();
      }, 800);
    });
  }
}