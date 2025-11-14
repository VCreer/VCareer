import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError,of } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { AuthApiService } from '../services/auth-Cookiebased/auth-api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Biến flag để biết hiện tại có đang refresh token hay không
  private isRefreshing = false;

  // BehaviorSubject dùng để "thông báo" cho các request đang chờ refresh token xong
  // false = chưa refresh xong
  // true  = refresh xong rồi → các request đang đợi có thể tiếp tục
  private refreshSubject = new BehaviorSubject<boolean>(false);

  constructor(private authApi: AuthApiService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Clone request để bật gửi cookie lên server (Quan trọng cho refresh token dạng cookie)
    const request = req.clone({ withCredentials: true });

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        // Nếu server trả về lỗi 401 → token đã hết hạn
        if (err && err.status === 401) {
          return this.handle401(request, next);
        }

        // Nếu lỗi không phải 401 → trả lỗi ra ngoài
        return throwError(() => err);
      })
    );
  }

  private handle401(request: HttpRequest<any>, next: HttpHandler) {

    // CASE 1: Nếu đang refresh token rồi → request hiện tại phải đứng đợi
    if (this.isRefreshing) {
      return this.refreshSubject.pipe(
        // Chờ đến khi refreshSubject phát ra true
        filter(v => v === true),

        // Chỉ lấy 1 lần rồi dừng
        take(1),

        // Sau khi refresh xong → gửi lại request ban đầu
        switchMap(() => next.handle(request))
      );
    }

    // CASE 2: Chưa refresh → bắt đầu refresh token
    this.isRefreshing = true;

    // Đánh dấu chưa refresh xong
    this.refreshSubject.next(false);

    // Gọi API refresh token
    return this.authApi.refreshToken().pipe(

      // Nếu refresh thành công
      switchMap(() => {
        // Báo cho những request đang đợi → refresh xong
        this.refreshSubject.next(true);

        // Gửi lại request ban đầu
        return next.handle(request);
      }),

      // Nếu refresh thất bại (vd: refresh token hết hạn) → logout client
    catchError((err) => {
  // trả về observable logout rồi mới throwError
  this.refreshSubject.next(false);
  return this.authApi.logOut().pipe(
    catchError(() => of(null)), // nếu logout API cũng lỗi thì bỏ qua
    switchMap(() => throwError(() => err))
  );
}),


      // Dù thành công hay thất bại → luôn reset isRefreshing
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }
}
