import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

/**
 * Mock Authentication Service - Xử lý các API liên quan đến xác thực
 * Bao gồm: Forgot Password, Verify OTP, Reset Password
 */
@Injectable({
  providedIn: 'root'
})
export class AuthMockService {

  /**
   * Mock forgot password - Gửi OTP qua email
   * @param emailData - Thông tin email {email}
   * @returns Observable của forgot password response
   */
  mockForgotPassword(emailData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { email } = emailData;
        
        // Lưu email vào localStorage để verify-otp sử dụng
        localStorage.setItem('forgot_password_email', email);
        
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            message: 'OTP đã được gửi đến email của bạn',
            email: email
          }
        }));
        observer.complete();
      }, 1500);
    });
  }

  /**
   * Mock verify OTP - Xác thực mã OTP
   * @param otpData - Thông tin OTP {otp}
   * @returns Observable của verify OTP response
   */
  mockVerifyOtp(otpData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { otp } = otpData;
        
        // Kiểm tra OTP (mock: chỉ chấp nhận '123456')
        if (otp === '123456') {
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              message: 'OTP xác thực thành công',
              verified: true
            }
          }));
        } else {
          observer.next(new HttpResponse({
            status: 400,
            body: {
              success: false,
              message: 'Mã OTP không đúng'
            }
          }));
        }
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock reset password - Đặt lại mật khẩu mới
   * @param passwordData - Thông tin mật khẩu mới {password, confirmPassword}
   * @returns Observable của reset password response
   */
  mockResetPassword(passwordData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { password, confirmPassword } = passwordData;
        
        // Kiểm tra password match
        if (password !== confirmPassword) {
          observer.next(new HttpResponse({
            status: 400,
            body: {
              success: false,
              message: 'Mật khẩu xác nhận không khớp'
            }
          }));
        } else {
          // Xóa email khỏi localStorage
          localStorage.removeItem('forgot_password_email');
          
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              message: 'Mật khẩu đã được đặt lại thành công'
            }
          }));
        }
        observer.complete();
      }, 2000);
    });
  }
}
