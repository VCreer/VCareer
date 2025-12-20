import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { NavigationService } from '../core/services/navigation.service';
import { AuthStateService } from '../core/services/auth-Cookiebased/auth-state.service';
import { ToastNotificationService } from '../shared/services/toast-notification.service';
import { TeamManagementService } from '../proxy/services/team-management';
import { Observable, of } from 'rxjs';
import { map, take, catchError, switchMap } from 'rxjs/operators';

/**
 * LeaderRecruiterVerifiedGuard - Bảo vệ các route chỉ dành cho Leader Recruiter đã xác thực (Cấp 3/3)
 * Chỉ cho phép Leader Recruiter đã xác thực tài khoản truy cập các trang này
 */
@Injectable({ providedIn: 'root' })
export class LeaderRecruiterVerifiedGuard implements CanActivate {
  private lastToastTime: number = 0;
  private readonly TOAST_COOLDOWN = 3000; // Chỉ hiển thị toast mỗi 3 giây

  constructor(
    private navigationService: NavigationService,
    private authStateService: AuthStateService,
    private router: Router,
    private toastService: ToastNotificationService,
    private teamManagementService: TeamManagementService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const user = this.authStateService.user;

    // CASE 1: Chưa đăng nhập → redirect to login
    if (!user) {
      console.log('[LeaderRecruiterVerifiedGuard] User not logged in:', state.url);
      this.router.navigate(['/recruiter/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // CASE 2: Kiểm tra role RECRUITER
    const backendRoles = user.roles ?? [];
    const isRecruiter = backendRoles.some(role => 
      role.toLowerCase().includes('recruiter') || role.toLowerCase() === 'hr_staff'
    );

    if (!isRecruiter) {
      console.warn('[LeaderRecruiterVerifiedGuard] User is not a recruiter:', state.url);
      // Chỉ hiển thị toast nếu chưa hiển thị trong 3 giây gần đây
      if (Date.now() - this.lastToastTime > this.TOAST_COOLDOWN) {
        this.toastService.error('Bạn không có quyền truy cập trang này.');
        this.lastToastTime = Date.now();
      }
      // Redirect về trang verify hoặc trang không có guard này
      if (!state.url.includes('/recruiter/recruiter-verify')) {
        this.router.navigate(['/recruiter/recruiter-verify']);
      }
      return false;
    }

    // CASE 3: Kiểm tra xem có phải Leader Recruiter và đã verified không
    // Đợi cả userInfo và verification status được load
    return this.teamManagementService.getCurrentUserInfo().pipe(
      catchError(error => {
        console.error('[LeaderRecruiterVerifiedGuard] Error loading user info:', error);
        return of(null);
      }),
      switchMap(userInfo => {
        // Kiểm tra xem có phải Leader Recruiter
        const isLeader = userInfo ? !!userInfo.isLead : backendRoles.some(role => 
          role.toLowerCase() === 'lead_recruiter'
        );

        if (!isLeader) {
          // Không phải Leader → có thể là HR Staff, cho phép truy cập
          console.log('[LeaderRecruiterVerifiedGuard] User is HR Staff, access granted:', state.url);
          return of(true);
        }

        // Là Leader Recruiter → kiểm tra verification status
        // Đợi verification status được load từ NavigationService
        return this.navigationService.isVerified$.pipe(
          take(1),
          map(isVerified => {
            if (!isVerified) {
              console.warn('[LeaderRecruiterVerifiedGuard] Leader Recruiter not verified:', state.url);
              
              // Chỉ hiển thị toast nếu chưa hiển thị trong 3 giây gần đây
              if (Date.now() - this.lastToastTime > this.TOAST_COOLDOWN) {
                this.toastService.warning(
                  'Chỉ Leader Recruiter đã xác thực tài khoản (Cấp 3/3) mới được phép sử dụng nhé',
                  5000
                );
                this.lastToastTime = Date.now();
              }
              
              // Redirect về trang verify thay vì recruitment-report để tránh vòng lặp
              // Chỉ redirect nếu không phải đang ở trang verify
              if (!state.url.includes('/recruiter/recruiter-verify')) {
                this.router.navigate(['/recruiter/recruiter-verify']);
              }
              return false;
            }

            // Leader Recruiter đã verified → cho phép truy cập
            console.log('[LeaderRecruiterVerifiedGuard] Leader Recruiter verified, access granted:', state.url);
            return true;
          }),
          catchError(error => {
            console.error('[LeaderRecruiterVerifiedGuard] Error checking verification status:', error);
            // Fallback: kiểm tra verification status từ NavigationService
            const isVerified = this.navigationService.isVerified();
            if (!isVerified) {
              // Chỉ hiển thị toast nếu chưa hiển thị trong 3 giây gần đây
              if (Date.now() - this.lastToastTime > this.TOAST_COOLDOWN) {
                this.toastService.warning(
                  'Chỉ Leader Recruiter đã xác thực tài khoản (Cấp 3/3) mới được phép sử dụng nhé',
                  5000
                );
                this.lastToastTime = Date.now();
              }
              // Redirect về trang verify thay vì recruitment-report để tránh vòng lặp
              if (!state.url.includes('/recruiter/recruiter-verify')) {
                this.router.navigate(['/recruiter/recruiter-verify']);
              }
              return of(false);
            }
            return of(true);
          })
        );
      }),
    );
  }
}

