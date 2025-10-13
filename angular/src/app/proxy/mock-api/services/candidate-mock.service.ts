import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
   */
  mockCandidateRegister(candidateData: any): Observable<any> {
    const token = 'mock_candidate_token_' + Date.now();
    
    return of({
      success: true,
      token: token,
      user: {
        id: Date.now(),
        email: candidateData.email,
        fullName: candidateData.fullName,
        userType: 'candidate'
      }
    }).pipe(delay(1500));
  }

  /**
   * Mock candidate login - Đăng nhập ứng viên
   */
  mockCandidateLogin(loginData: any): Observable<any> {
    const token = 'mock_candidate_token_' + Date.now();
    
    return of({
      success: true,
      token: token,
      user: {
        id: Date.now(),
        email: loginData.email,
        fullName: 'Mock Candidate',
        userType: 'candidate'
      }
    }).pipe(delay(1000));
  }
}