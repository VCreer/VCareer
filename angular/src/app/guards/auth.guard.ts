// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthStateService } from '../core/services/auth-Cookiebased/auth-state.service';
import { UnauthorizedModalService } from '../shared/services/unauthorized-modal.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { getPrimaryRoutingRole } from './RoleMapping.service';

/**
 * AuthGuard - Bảo vệ các route yêu cầu role cụ thể
 * CHỈ kiểm tra auth khi route có data.role
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private state: AuthStateService,
    private router: Router,
    private unauthorizedModal: UnauthorizedModalService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    return this.state.user$.pipe(
      take(1),
      map(user => {
        // Lấy required role từ route data
        const requiredRole = route.data['role'] as 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE' | undefined;

        // CASE 1: Route không yêu cầu role cụ thể → cho phép truy cập (public route)
        if (!requiredRole) {
          return true;
        }

        // CASE 2: Route yêu cầu role nhưng chưa đăng nhập → redirect to login
        if (!user) {
          this.redirectToLogin(requiredRole, state.url);
          return false;
        }

        // CASE 3: Đã login → kiểm tra role
        const backendRoles = user.roles ?? [];
        const primaryRole = getPrimaryRoutingRole(backendRoles);

        if (!primaryRole) {
          console.warn('[AuthGuard] User has no valid routing role');
          this.redirectToLogin(requiredRole, state.url);
          return false;
        }

        // CASE 4: Sai role → hiện modal và redirect về home của role hiện tại
        if (primaryRole !== requiredRole) {
          console.warn(`[AuthGuard] Role mismatch: required=${requiredRole}, actual=${primaryRole}`);
          this.unauthorizedModal.show('Bạn không có quyền truy cập trang này.');
          this.redirectToRoleHome(primaryRole);
          return false;
        }

        // CASE 5: Đúng role → cho phép truy cập
        return true;
      })
    );
  }

  /**
   * Redirect đến trang login phù hợp với role yêu cầu
   */
  private redirectToLogin(requiredRole: 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE', attemptedUrl: string): void {
    const loginMap = {
      EMPLOYEE: ['/employee/login'],
      RECRUITER: ['/recruiter/login'],
      CANDIDATE: ['/candidate/login'],
    };

    this.router.navigate(loginMap[requiredRole], {
      queryParams: { returnUrl: attemptedUrl }
    });
  }

  /**
   * Redirect về trang home phù hợp với role của user
   */
  private redirectToRoleHome(role: 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE'): void {
    const homeMap = {
      EMPLOYEE: ['/employee/statistical-reports'],
      RECRUITER: ['/recruiter/recruitment-report'],
      CANDIDATE: ['candidate/home'],
    };

    this.router.navigate(homeMap[role]).catch(err => {
      console.error('[AuthGuard] Navigation error:', err);
    });
  }
}