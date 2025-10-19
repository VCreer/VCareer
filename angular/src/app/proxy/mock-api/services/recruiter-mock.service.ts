import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Mock Recruiter Service - Xử lý các API liên quan đến nhà tuyển dụng
 * Bao gồm: Register, Login
 */
@Injectable({
  providedIn: 'root'
})
export class RecruiterMockService {

  /**
   * Mock recruiter register - Đăng ký nhà tuyển dụng
   */
  mockRecruiterRegister(recruiterData: any): Observable<any> {
    const token = 'mock_recruiter_token_' + Date.now();
    
    return of({
      success: true,
      token: token,
      user: {
        id: Date.now(),
        email: recruiterData.email,
        fullName: recruiterData.fullName,
        userType: 'recruiter',
        companyName: recruiterData.companyName
      }
    }).pipe(delay(1500));
  }

  /**
   * Mock recruiter login - Đăng nhập nhà tuyển dụng
   */
  mockRecruiterLogin(loginData: any): Observable<any> {
    const token = 'mock_recruiter_token_' + Date.now();
    
    return of({
      success: true,
      token: token,
      user: {
        id: Date.now(),
        email: loginData.email,
        fullName: 'Mock Recruiter',
        userType: 'recruiter',
        companyName: 'Mock Company'
      }
    }).pipe(delay(1000));
  }
}