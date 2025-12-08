// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthApiService } from '../services/auth-Cookiebased/auth-api.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authApi = inject(AuthApiService);
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError(error => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // TRƯỜNG HỢP ĐẶC BIỆT: KHÔNG REFRESH KHI GỌI CURRENT-USER HOẶC REFRESH-TOKEN
      const url = error.url?.toLowerCase() || '';
      if (
        url.includes('/current-user') ||
        url.includes('/refesh-token') ||
        url.includes('/log-out')
      ) {
        console.log('[Interceptor] 401 ignored (startup/refresh/logout):', url);
        return throwError(() => error); // Không refresh, để APP_INITIALIZER xử lý
      }

      // Chỉ refresh 1 lần
      if (isRefreshing) {
        return throwError(() => error); // Đang refresh → reject luôn, không queue
      }

      isRefreshing = true;
      console.log('[Interceptor] Starting token refresh...');

      return authApi.refeshToken().pipe(
        switchMap(() => {
          console.log('[Interceptor] Refresh success → retry original request');
          isRefreshing = false;
          return next(authReq);
        }),
        catchError(refreshError => {
          console.error('[Interceptor] Refresh failed → logout');
          isRefreshing = false;
          return authApi.logOut().pipe(
            switchMap(() => throwError(() => refreshError))
          );
        }),
        finalize(() => {
          isRefreshing = false;
        })
      );
    })
  );
};