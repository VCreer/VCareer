import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

/**
 * Mock Candidate Service - Xử lý các API liên quan đến ứng viên
 * Bao gồm: Register, Login
 */
@Injectable({
  providedIn: 'root'
})
export class CandidateMockService {

  /**
   * Mock candidate register - Đăng ký ứng viên
   * @param candidateData - Thông tin ứng viên
   * @returns Observable của candidate register response
   */
  mockCandidateRegister(candidateData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = 'mock_candidate_token_' + Date.now();
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            token: token,
            user: {
              id: Date.now(),
              email: candidateData.email,
              firstName: candidateData.firstName,
              lastName: candidateData.lastName,
              phone: candidateData.phone,
              gender: candidateData.gender,
              role: 'candidate'
            }
          }
        }));
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock candidate login - Đăng nhập ứng viên
   * @param credentials - Thông tin đăng nhập
   * @returns Observable của candidate login response
   */
  mockCandidateLogin(credentials: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { email, password } = credentials;
        
        // Mock credentials
        if (email === 'candidate@example.com' && password === 'candidate123') {
          const token = 'mock_candidate_token_' + Date.now();
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              token: token,
              user: {
                id: 1,
                email: 'candidate@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'candidate'
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
