// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';
// import { delay, map } from 'rxjs/operators';

// export interface LoginRequest {
//   email: string;
//   password: string;
// }

// export interface RegisterRequest {
//   email: string;
//   password: string;
//   fullName: string;
//   userType: 'candidate' | 'recruiter';
// }

// export interface AuthResponse {
//   token: string;
//   user: {
//     id: string;
//     email: string;
//     fullName: string;
//     userType: 'candidate' | 'recruiter';
//   };
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   constructor() {}

//   login(credentials: LoginRequest): Observable<AuthResponse> {
//     // Simulate API call
//     return of({
//       token: 'mock-jwt-token-' + Date.now(),
//       user: {
//         id: '1',
//         email: credentials.email,
//         fullName: 'Mock User',
//         userType: credentials.email.includes('recruiter') ? 'recruiter' : 'candidate'
//       }
//     }).pipe(delay(1000));
//   }

//   register(userData: RegisterRequest): Observable<AuthResponse> {
//     // Simulate API call
//     return of({
//       token: 'mock-jwt-token-' + Date.now(),
//       user: {
//         id: '1',
//         email: userData.email,
//         fullName: userData.fullName,
//         userType: userData.userType
//       }
//     }).pipe(delay(1000));
//   }

//   forgotPassword(email: string): Observable<{ message: string }> {
//     return of({ message: 'Password reset email sent' }).pipe(delay(500));
//   }

//   verifyOTP(otp: string): Observable<{ valid: boolean }> {
//     return of({ valid: otp === '123456' }).pipe(delay(300));
//   }

//   resetPassword(password: string): Observable<{ message: string }> {
//     return of({ message: 'Password reset successfully' }).pipe(delay(500));
//   }

//   logout(): Observable<{ message: string }> {
//     localStorage.removeItem('auth_token');
//     return of({ message: 'Logged out successfully' });
//   }

//   getCurrentUser(): Observable<any> {
//     const token = localStorage.getItem('auth_token');
//     if (token) {
//       return of({
//         id: '1',
//         email: 'user@example.com',
//         fullName: 'Mock User',
//         userType: 'candidate'
//       });
//     }
//     return of(null);
//   }
// }
