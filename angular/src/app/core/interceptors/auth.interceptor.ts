import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

/**
 * Auth Interceptor - Chi gan token vao cac request can authentication
 * 
 * Chi gan token vao cac endpoint:
 * - /api/jobs/{id}/save - save/unsave job
 * - /api/jobs/saved - danh sach job da luu
 * - /api/profile/* - cac API profile
 * - Cac endpoint khac co Authorize attribute
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  // Danh sách URL cần gắn token
  private readonly authRequiredPatterns = [
    /\/api\/jobs\/[^/]+\/save$/,           // save/unsave job
    /\/api\/jobs\/saved/,                   // danh sách đã lưu
    /\/api\/jobs\/[^/]+\/save-status/,      // trạng thái đã lưu
    /\/api\/jobs\/[0-9a-fA-F-]+$/,          // chi tiết job theo id (để trả isSaved)
    /\/api\/jobs\/slug\/.+$/,               // chi tiết job theo slug
    /\/api\/jobs\/search$/,                 // tìm kiếm job -> cần token để điền isSaved trong JobViewDto
    /\/api\/profile\//,                     // các API profile
    /\/api\/cv\//,                          // các API cv
    /\/api\/applications\//,                // các API applications (apply, check-status, etc.)
  ];

  private requiresAuth(url: string): boolean {
    return this.authRequiredPatterns.some((p) => p.test(url));
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Chuẩn hóa URL để match pattern
    let url = request.url;
    let pathname = url;
    
    // Xử lý cả relative và absolute URL
    try {
      // Nếu là absolute URL (có protocol)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const u = new URL(url);
        pathname = u.pathname;
      } else {
        // Nếu là relative URL, sử dụng trực tiếp
        // Loại bỏ query string nếu có
        pathname = url.split('?')[0];
      }
    } catch (e) {
      // Nếu parse URL thất bại, sử dụng URL gốc (loại bỏ query string)
      pathname = url.split('?')[0];
    }

    // Kiểm tra xem URL có cần authentication không
    const needsAuth = this.requiresAuth(pathname);
    
    if (needsAuth) {
      const token =
        localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (token) {
        request = request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        console.log('[AuthInterceptor] Token attached to:', pathname);
      } else {
        console.warn('[AuthInterceptor] Token not found for:', pathname);
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Xử lý lỗi 401 - không redirect tự động
        // Để component tự quyết định cách xử lý
        if (error.status === 401) {
          console.warn('[AuthInterceptor] 401 Unauthorized for:', pathname);
          // Không redirect tự động - để component xử lý
        }
        return throwError(() => error);
      })
    );
  }
}

