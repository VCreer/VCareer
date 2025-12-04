// src/app/core/services/auth-Cookiebased/app-auth-initializer.ts

import { inject } from '@angular/core';
import { AuthFacadeService } from './auth-facade.service';
import { provideAppInitializer } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError,take } from 'rxjs/operators';
import { of } from 'rxjs';

export const APP_CURRENT_USER_INITIALIZER = provideAppInitializer(() => {
  const authFacade = inject(AuthFacadeService);

  // Luôn cho app chạy, dù có lỗi gì
  return firstValueFrom(
    authFacade.loadCurrentUser().pipe(
      take(1),
      timeout(6000),
      catchError(err => {
        console.warn('[App Init] Không thể load user (chưa đăng nhập hoặc lỗi) → tiếp tục như guest', err);
        return of(null);
      })
    )
  );
});