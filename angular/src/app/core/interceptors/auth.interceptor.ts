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
    try {
      const u = new URL(url);
      url = u.pathname;
    } catch {}

    if (this.requiresAuth(url)) {
      const token =
        localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        request = request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }
}

