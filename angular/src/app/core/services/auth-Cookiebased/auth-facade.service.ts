import { Injectable } from '@angular/core';
import { AuthStateService } from './auth-state.service';
import { catchError, map, switchMap, tap, timeout, shareReplay } from 'rxjs/operators';
import { Observable, throwError, of, EMPTY } from 'rxjs';
import { AuthApiService } from './auth-api.service';
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

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  // Cache request với shareReplay
  private loadUserRequest$: Observable<CurrentUserInfoDto | null> | null = null;

  constructor(
    private authService: AuthApiService,
    private state: AuthStateService
  ) {}

  /**
   * Load user với proper caching và error handling
   * Tránh vòng lặp bằng cách:
   * 1. Chỉ call API một lần (shareReplay)
   * 2. Luôn return of(null) khi error (không throw)
   * 3. Set timeout để tránh blocking
   */
  loadCurrentUser(): Observable<CurrentUserInfoDto | null> {
    // Return cached request nếu có
    if (this.loadUserRequest$) {
      return this.loadUserRequest$;
    }

    // Tạo request mới với shareReplay để cache
    this.loadUserRequest$ = this.authService.getCurrentUser().pipe(
      timeout(5000), // Timeout sau 5s
      tap(user => {
        this.state.setUser(user);
      }),
      catchError(err => {
        console.warn('[AuthFacade] Cannot load user → guest mode', err.status || err.message);
        this.state.setUser(null);
        // QUAN TRỌNG: Return of(null) thay vì throwError để không gây loop
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return this.loadUserRequest$;
  }

  /**
   * Force reload user (clear cache)
   * Dùng khi: login, logout, refresh profile
   */
  forceReloadUser(): Observable<CurrentUserInfoDto | null> {
    this.loadUserRequest$ = null;
    return this.loadCurrentUser();
  }

  /**
   * Login candidate
   */
  loginCandidate(payload: { email: string; password: string }): Observable<void> {
    return this.authService.candidateLogin(payload as LoginDto).pipe(
      switchMap(() => this.forceReloadUser()),
      map(() => void 0)
    );
  }

  /**
   * Register candidate
   */
  registerCandidate(payload: CandidateRegisterDto): Observable<void> {
    return this.authService.candidateRegister(payload);
  }

  /**
   * Login recruiter
   */
  loginRecruiter(payload: LoginDto): Observable<void> {
    return this.authService.recruiterLogin(payload).pipe(
      switchMap(() => this.forceReloadUser()),
      map(() => void 0)
    );
  }

  /**
   * Register recruiter
   */
  registerRecruiter(payload: RecruiterRegisterDto): Observable<void> {
    return this.authService.recruiterRegister(payload);
  }

  /**
   * Login employee
   */
  loginEmployee(payload: EmployeeLoginDto): Observable<void> {
    return this.authService.employeeLogin(payload).pipe(
      switchMap(() => this.forceReloadUser()),
      map(() => void 0)
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
   * Login with Google
   */
  loginWithGoogle(payload: GoogleLoginDto): Observable<void> {
    return this.authService.loginWithGoogle(payload).pipe(
      switchMap(() => this.forceReloadUser()),
      map(() => void 0)
    );
  }

  /**
   * Logout với proper cleanup
   */
  logout(): Observable<void> {
    return this.authService.logOut().pipe(
      tap(() => {
        this.state.setUser(null);
        this.loadUserRequest$ = null;
      }),
      map(() => void 0),
      catchError(err => {
        // Clear state ngay cả khi logout API fail
        this.state.setUser(null);
        this.loadUserRequest$ = null;
        console.error('[AuthFacade] Logout error (state cleared anyway):', err);
        // Không throw error → cho phép UI tiếp tục
        return of(void 0);
      })
    );
  }

  /**
   * Logout all devices với proper cleanup
   */
  logoutAllDevices(): Observable<void> {
    return this.authService.logOutAllDevice().pipe(
      tap(() => {
        this.state.setUser(null);
        this.loadUserRequest$ = null;
      }),
      map(() => void 0),
      catchError(err => {
        // Clear state ngay cả khi logout API fail
        this.state.setUser(null);
        this.loadUserRequest$ = null;
        console.error('[AuthFacade] Logout all devices error (state cleared anyway):', err);
        // Không throw error → cho phép UI tiếp tục
        return of(void 0);
      })
    );
  }
}