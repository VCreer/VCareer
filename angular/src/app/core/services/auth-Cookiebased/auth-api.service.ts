import { Injectable } from '@angular/core';
import { AuthService } from '../../../proxy/services/auth';
import { Observable } from 'rxjs';
//bọc thêm api proxy bằng with credential để đính kèm cookie với request nếu ko thì request ko có cookie đi kèm

import type {
  LoginDto,
  CandidateRegisterDto,
  RecruiterRegisterDto,
  CreateEmployeeDto,
  CurrentUserInfoDto,
  EmployeeLoginDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  ResetPasswordDto,
} from '../../../proxy/dto/auth-dto/models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private authService: AuthService) {}

  private cfg = { withCredentials: true } as any;

  candidateLogin(input: LoginDto): Observable<void> {
    return this.authService.candidateLogin(input, this.cfg);
  }

  candidateRegister(input: CandidateRegisterDto): Observable<void> {
    return this.authService.candidateRegister(input, this.cfg);
  }

  recruiterLogin(input: LoginDto): Observable<void> {
    return this.authService.recruiterLogin(input, this.cfg);
  }

  recruiterRegister(input: RecruiterRegisterDto): Observable<void> {
    return this.authService.recruiterRegister(input, this.cfg);
  }

  employeeLogin(input: EmployeeLoginDto): Observable<void> {
    return this.authService.employeeLogin(input, this.cfg);
  }

  createEmployee(input: CreateEmployeeDto): Observable<void> {
    return this.authService.createEmployee(input, this.cfg);
  }

  forgotPassword(input: ForgotPasswordDto): Observable<void> {
    return this.authService.forgotPassword(input, this.cfg);
  }

  resetPassword(input: ResetPasswordDto): Observable<void> {
    return this.authService.resetPassword(input, this.cfg);
  }

  loginWithGoogle(input: GoogleLoginDto): Observable<void> {
    return this.authService.loginWithGoogle(input, this.cfg);
  }

  getCurrentUser(): Observable<CurrentUserInfoDto> {
    return this.authService.getCurrentUser(this.cfg);
  }

  refreshToken(): Observable<void> {
    return this.authService.refeshToken(this.cfg);
  }

  logOut(): Observable<void> {
    return this.authService.logOut(this.cfg);
  }

  logOutAllDevice(): Observable<void> {
    return this.authService.logOutAllDevice(this.cfg);
  }
}
