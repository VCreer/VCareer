import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

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
   * @param recruiterData - Thông tin nhà tuyển dụng
   * @returns Observable của recruiter register response
   */
  mockRecruiterRegister(recruiterData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = 'mock_recruiter_token_' + Date.now();
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            token: token,
            user: {
              id: Date.now(),
              email: recruiterData.email,
              firstName: recruiterData.firstName,
              lastName: recruiterData.lastName,
              phone: recruiterData.phone,
              gender: recruiterData.gender,
              companyName: recruiterData.companyName,
              role: 'recruiter'
            }
          }
        }));
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock recruiter login - Đăng nhập nhà tuyển dụng
   * @param credentials - Thông tin đăng nhập
   * @returns Observable của recruiter login response
   */
  mockRecruiterLogin(credentials: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { email, password } = credentials;
        
        // Mock credentials
        if (email === 'recruiter@example.com' && password === 'recruiter123') {
          const token = 'mock_recruiter_token_' + Date.now();
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              token: token,
              user: {
                id: 2,
                email: 'recruiter@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                companyName: 'Tech Corp',
                role: 'recruiter'
              }
            }
          }));
        } else {
          observer.next(new HttpResponse({
            status: 401,
            body: {
              success: false,
              message: 'Email hoặc mật khẩu không đúng'
            }
          }));
        }
        observer.complete();
      }, 1500);
    });
  }
}
