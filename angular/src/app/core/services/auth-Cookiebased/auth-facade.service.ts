import { Injectable } from '@angular/core';
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
import { catchError, map, switchMap, tap, finalize, shareReplay, timeout, take } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { AuthApiService } from './auth-api.service';


@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  // Cache request đang chạy để tránh gọi API nhiều lần
  private loadUserRequest$: Observable<CurrentUserInfoDto | null> | null = null;

  constructor(
    private authService: AuthApiService,
    private state: AuthStateService
  ) {}

  /**
   * Login candidate và load user info
   */
  loginCandidate(payload: { email: string; password: string }): Observable<void> {
    return this.authService.candidateLogin(payload as LoginDto).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  loadCurrentUser(): Observable<CurrentUserInfoDto | null> {
  return this.authService.getCurrentUser().pipe(
    take(1),
    timeout(6000),
    tap(user => {
      this.state.setUser(user);
      console.log('[AuthFacade] User loaded:', user);
    }),
    catchError(err => {
      console.warn('[AuthFacade] Không thể load user → guest mode', err);
      this.state.setUser(null);
      return of(null);
    })
  );
}

  /**
   * Refresh token (dùng trong interceptor)
   */
  refreshToken(): Observable<void> {
    return this.authService.refeshToken();
  }

  /**
   * Logout và clear state
   */
  logout(): Observable<void> {
    return this.authService.logOut().pipe(
      tap(() => {
        this.state.setUser(null);
        console.log('[AuthFacade] User logged out');
      }),
      catchError(err => {
        // Dù logout fail vẫn clear state
        this.state.setUser(null);
        return throwError(() => err);
      })
    );
  }

  /**
   * Register candidate
   */
  registerCandidate(payload: CandidateRegisterDto): Observable<void> {
    return this.authService.candidateRegister(payload);
  }

  /**
   * Login recruiter và load user info
   */
  loginRecruiter(payload: LoginDto): Observable<void> {
    return this.authService.recruiterLogin(payload).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  /**
   * Register recruiter
   */
  registerRecruiter(payload: RecruiterRegisterDto): Observable<void> {
    return this.authService.recruiterRegister(payload);
  }

  /**
   * Login employee và load user info
   */
  loginEmployee(payload: EmployeeLoginDto): Observable<void> {
    return this.authService.employeeLogin(payload).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  /**
   * Create employee account
   */
  createEmployee(payload: CreateEmployeeDto): Observable<void> {
    return this.authService.createEmployee(payload);
  }

  /**
   * Forgot password
   */
  forgotPassword(payload: ForgotPasswordDto): Observable<void> {
    return this.authService.forgotPassword(payload);
  }

  /**
   * Reset password
   */
  resetPassword(payload: ResetPasswordDto): Observable<void> {
    return this.authService.resetPassword(payload);
  }

  /**
   * Login with Google và load user info
   */
  loginWithGoogle(payload: GoogleLoginDto): Observable<void> {
    return this.authService.loginWithGoogle(payload).pipe(
      switchMap(() => this.loadCurrentUser().pipe(map(() => void 0)))
    );
  }

  /**
   * Logout all devices và clear state
   */
  logoutAllDevices(): Observable<void> {
    return this.authService.logOutAllDevice().pipe(
      tap(() => {
        this.state.setUser(null);
        console.log('[AuthFacade] User logged out from all devices');
      }),
      catchError(err => {
        // Dù logout fail vẫn clear state
        this.state.setUser(null);
        return throwError(() => err);
      })
    );
  }

  /**
   * Force reload user (clear cache và load lại)
   * Dùng khi cần refresh user info ngay cả khi đang có request
   */
  forceReloadUser(): Observable<CurrentUserInfoDto | null> {
    this.loadUserRequest$ = null; // Clear cache
    return this.loadCurrentUser();
  }
}