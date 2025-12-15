// src/app/core/interceptors/error-handler.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  // Chỉ xử lý cho forgot/reset password APIs
  const isForgotPasswordApi = req.url.includes('/forgot-password') || 
                              req.url.includes('/reset-password') ||
                              req.url.includes('/candidate-forgot-password') ||
                              req.url.includes('/candidate-reset-password') ||
                              req.url.includes('/recruiter-forgot-password') ||
                              req.url.includes('/recruiter-reset-password');

  if (!isForgotPasswordApi) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Thay vì throw error, return một response với error data
      // Điều này ngăn ABP hiển thị modal vì không có error được throw
      // Component vẫn có thể xử lý error thông qua response body
      const errorResponse = new HttpResponse({
        body: { _error: true, error: error.error },
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined,
        headers: error.headers,
      });
      
      // Return success response với error data để component xử lý
      return of(errorResponse);
    })
  );
};

