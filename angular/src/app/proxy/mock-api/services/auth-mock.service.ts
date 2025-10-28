import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
   */
  mockForgotPassword(emailData: { email: string }): Observable<any> {
    // Lưu email vào localStorage để verify-otp sử dụng
    localStorage.setItem('forgot_password_email', emailData.email);
    
    return of({
      success: true,
      message: 'OTP đã được gửi đến email của bạn',
      email: emailData.email
    }).pipe(delay(1500));
  }

  /**
   * Mock verify OTP - Xác thực mã OTP
   */
  mockVerifyOtp(otpData: { otp: string }): Observable<any> {
    // Kiểm tra OTP (mock: chỉ chấp nhận '123456')
    const isValid = otpData.otp === '123456';
    
    return of({
      success: isValid,
      message: isValid ? 'OTP xác thực thành công' : 'Mã OTP không đúng',
      verified: isValid
    }).pipe(delay(2000));
  }

  /**
   * Mock reset password - Đặt lại mật khẩu mới
   */
  mockResetPassword(passwordData: { password: string; confirmPassword: string }): Observable<any> {
    // Kiểm tra password match
    if (passwordData.password !== passwordData.confirmPassword) {
      return of({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      }).pipe(delay(2000));
    }
    
    // Xóa email khỏi localStorage
    localStorage.removeItem('forgot_password_email');
    
    return of({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công'
    }).pipe(delay(2000));
  }
}
