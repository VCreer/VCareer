// auth.interceptor.ts - FINAL VERSION
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthApiService } from '../services/auth-Cookiebased/auth-api.service';
import { UnauthorizedModalService } from '../../shared/services/unauthorized-modal.service';
import { throwError, BehaviorSubject, EMPTY, timer } from 'rxjs';
import { catchError, switchMap, finalize, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

let refreshTokenSubject: BehaviorSubject<boolean> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authApi = inject(AuthApiService);
  const unauthorizedModal = inject(UnauthorizedModalService);
  const router = inject(Router);
  
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 403 Forbidden
     if (error.status === 403) {
  const abpError = error?.error?.error;
  const errorCode = abpError?.code;
  const errorMessage = abpError?.message ?? '';

  // ✅ Business / UserFriendly error → KHÔNG show modal
  const isAuthorizationError =
    errorCode?.startsWith('AbpAuthorization') ||
    errorMessage.toLowerCase().includes('permission') ||
    errorMessage.toLowerCase().includes('not allowed');

  if (isAuthorizationError) {
    unauthorizedModal.show(errorMessage || 'Bạn không có quyền truy cập trang này.');
  }

  return throwError(() => error);
}


      // Ignore non-401 errors
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const url = error.url?.toLowerCase() || '';
      const skipRefreshEndpoints = [
        '/current-user',
        '/refesh-token',
        '/log-out',
        '/candidate-login',
        '/recruiter-login',
        '/employee-login',
        '/candidate-register',
        '/recruiter-register',
        '/search-jobs', // ✅ Public API - không cần đăng nhập
        '/job-search', // ✅ Public API - không cần đăng nhập
      ];

      if (skipRefreshEndpoints.some(endpoint => url.includes(endpoint))) {
        return throwError(() => error);
      }

      const currentUrl = router.url;
      // Bỏ query params khi check public route
      const urlWithoutQuery = currentUrl.split('?')[0];
      const publicRoutes = ['/', '/job', '/job-detail', '/terms-of-service', '/company', '/about-us', '/contact'];
      const isPublicRoute = publicRoutes.some(route => 
        urlWithoutQuery === route || urlWithoutQuery.startsWith(route + '/')
      );

      if (isPublicRoute) {
        return throwError(() => error);
      }

      if (refreshTokenSubject) {
        return refreshTokenSubject.pipe(
          filter(success => success),
          take(1),
          switchMap(() => next(authReq)),
          catchError(() => EMPTY)
        );
      }

      refreshTokenSubject = new BehaviorSubject<boolean>(false);

      return authApi.refeshToken().pipe(
        switchMap(() => {
          refreshTokenSubject?.next(true);
          refreshTokenSubject?.complete();
          refreshTokenSubject = null;
          return next(authReq);
        }),
        catchError(refreshError => {
          refreshTokenSubject?.next(false);
          refreshTokenSubject?.complete();
          refreshTokenSubject = null;

          if (!isPublicRoute) {
            return authApi.logOut().pipe(
              finalize(() => {
                const loginMap: Record<string, string> = {
                  '/employee': '/employee/login',
                  '/recruiter': '/recruiter/login',
                };
                const loginPath = Object.keys(loginMap).find(key => currentUrl.startsWith(key));
                router.navigate([loginPath ? loginMap[loginPath] : '/candidate/login']);
              }),
              switchMap(() => throwError(() => refreshError))
            );
          }

          return throwError(() => refreshError);
        })
      );
    })
  );
};