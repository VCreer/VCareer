// src/app/core/services/auth-Cookiebased/auth-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CurrentUserInfoDto,
  LoginDto,
  CandidateRegisterDto,
  RecruiterRegisterDto,
  CreateEmployeeDto,
  EmployeeLoginDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  ResetPasswordDto,
} from '../../../proxy/dto/auth-dto/models';

/**
 * Auth API Service - Wrapper để bypass ABP proxy config issue
 * Dùng HttpClient trực tiếp thay vì ABP RestService
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly baseUrl = environment.apis.default.url;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<CurrentUserInfoDto> {
    return this.http.get<CurrentUserInfoDto>(
      `${this.baseUrl}/api/app/auth/current-user`
    );
  }

  candidateLogin(payload: LoginDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/candidate-login`,
      payload
    );
  }

  candidateRegister(payload: CandidateRegisterDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/candidate-register`,
      payload
    );
  }

  recruiterLogin(payload: LoginDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/recruiter-login`,
      payload
    );
  }

  recruiterRegister(payload: RecruiterRegisterDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/recruiter-register`,
      payload
    );
  }

  employeeLogin(payload: EmployeeLoginDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/employee-login`,
      payload
    );
  }

  createEmployee(payload: CreateEmployeeDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/employee`,
      payload
    );
  }

  refeshToken(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/refesh-token`,
      {}
    );
  }

  logOut(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/log-out`,
      {}
    );
  }

  logOutAllDevice(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/log-out-all-device`,
      {}
    );
  }

  forgotPassword(payload: ForgotPasswordDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/forgot-password`,
      payload
    );
  }

  resetPassword(payload: ResetPasswordDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/reset-password`,
      payload
    );
  }

  loginWithGoogle(payload: GoogleLoginDto): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/app/auth/login-with-google`,
      payload
    );
  }
}