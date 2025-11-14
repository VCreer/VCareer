import { inject } from '@angular/core';
import { AuthFacadeService } from './auth-facade.service';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { provideAppInitializer } from '@angular/core';


// cái này dùng để chạy lại api lấy current user trước khi khởi chạy angular
// khi refresh trang cũng thế - xóa ram , giờ mà ko có current user thì 
// các phần giao diện nhập nhằng giữa trạng thái đăng nhập hoặc ko
//cái này cấu hình dưới main.ts
export function initAuth() {
  const auth = inject(AuthFacadeService);

  return firstValueFrom(
    auth.loadCurrentUser().pipe(
       catchError(err => {
        console.log('loadCurrentUser error', err);
        return of(null);
      })))
}

export const APP_CURRENT_USER_INITIALIZER = provideAppInitializer(initAuth);
