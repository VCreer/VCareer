import { Injectable } from '@angular/core';
import { AuthService } from '../../../proxy/services/auth';
import { AuthStateService } from './auth-state.service';
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
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  constructor(private authService: AuthService, private state: AuthStateService) {}


  loginCandidate(payload: { email: string; password: string }): Observable<void> {
    return this.authService.candidateLogin(payload as LoginDto).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  loadCurrentUser(): Observable<CurrentUserInfoDto> {
    return this.authService.getCurrentUser().pipe(
      tap(user => this.state.setUser(user)),
      catchError(err => {
        this.state.setUser(null);
        return throwError(() => err);
      })
    );
  }

  refreshToken() {
    return this.authService.refeshToken();
  }

  logout() {
    return this.authService.logOut().pipe(
      tap(() => this.state.setUser(null)),
      catchError(err => {
        this.state.setUser(null);
        return throwError(() => err);
      })
    );
  }

  registerCandidate(payload: CandidateRegisterDto): Observable<void> {
    return this.authService.candidateRegister(payload);
  }

  loginRecruiter(payload: LoginDto): Observable<void> {
    return this.authService.recruiterLogin(payload).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  registerRecruiter(payload: RecruiterRegisterDto): Observable<void> {
    return this.authService.recruiterRegister(payload);
  }

  loginEmployee(payload: EmployeeLoginDto): Observable<void> {
    return this.authService.employeeLogin(payload).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  createEmployee(payload: CreateEmployeeDto): Observable<void> {
    return this.authService.createEmployee(payload);
  }

  forgotPassword(payload: ForgotPasswordDto): Observable<void> {
    return this.authService.forgotPassword(payload);
  }

  resetPassword(payload: ResetPasswordDto): Observable<void> {
    return this.authService.resetPassword(payload);
  }

  loginWithGoogle(payload: GoogleLoginDto): Observable<void> {
    return this.authService.loginWithGoogle(payload).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  logoutAllDevices(): Observable<void> {
    return this.authService.logOutAllDevice().pipe(
      tap(() => this.state.setUser(null)),
      catchError(err => {
        this.state.setUser(null);
        return throwError(() => err);
      })
    );
  }
}
