import { inject } from '@angular/core';
import { AuthFacadeService } from './auth-facade.service';
import { provideAppInitializer } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * APP_INITIALIZER - Load user khi app khởi động
 * 
 * - Luôn return success để không block app
 * - 401/403 là bình thường khi chưa login → guest mode
 * - Timeout được xử lý trong AuthFacadeService (5s)
 */
export const APP_CURRENT_USER_INITIALIZER = provideAppInitializer(() => {
  const authFacade = inject(AuthFacadeService);

  return firstValueFrom(
    authFacade.loadCurrentUser().pipe(
      catchError(err => {
        // Silent fail - không log vì 401/403 là bình thường
        return of(null);
      })
    )
  ).then(() => Promise.resolve()); // Luôn resolve để app tiếp tục
});