// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthStateService } from '../core/services/auth-Cookiebased/auth-state.service';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { getPrimaryRoutingRole } from './RoleMapping.service';

/**
 * AuthGuard - Bảo vệ các route yêu cầu login
 * Kiểm tra user đã login và có đúng role không
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private state: AuthStateService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // Lấy user từ state (đã được load bởi APP_INITIALIZER)
    return this.state.user$.pipe(
      take(1),
      map(user => {
        console.log('[AuthGuard] Checking access for:', state.url, 'User:', user);
        
        // Nếu chưa login → redirect về login
        if (!user) {
          console.log('[AuthGuard] User chưa login → redirect về login');
          this.redirectToLogin(state.url);
          return false;
        }

        // Lấy role từ user
        const backendRoles = user.roles ?? [];
        const primaryRole = getPrimaryRoutingRole(backendRoles);

        if (!primaryRole) {
          console.warn('[AuthGuard] User không có role hợp lệ → redirect về candidate login');
          this.router.navigate(['/candidate/login']);
          return false;
        }

        // Kiểm tra role từ route data
        const requiredRole = route.data['role'] as 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE' | undefined;
        
        if (requiredRole) {
          // Nếu route yêu cầu role cụ thể
          if (primaryRole !== requiredRole) {
            console.warn(
              `[AuthGuard] Role mismatch! User role: ${primaryRole}, Required: ${requiredRole} → redirect`
            );
            this.redirectToRoleHome(primaryRole);
            return false;
          }
        } else {
          // Nếu không có yêu cầu role cụ thể → kiểm tra từ URL
          const roleFromUrl = this.getRoleFromUrl(state.url);
          if (roleFromUrl && roleFromUrl !== primaryRole) {
            console.warn(
              `[AuthGuard] URL role mismatch! User role: ${primaryRole}, URL suggests: ${roleFromUrl} → redirect`
            );
            this.redirectToRoleHome(primaryRole);
            return false;
          }
        }

        console.log('[AuthGuard] Access granted for:', state.url);
        return true;
      })
    );
  }

  private getRoleFromUrl(url: string): 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE' | null {
    if (url.startsWith('/employee')) return 'EMPLOYEE';
    if (url.startsWith('/recruiter')) return 'RECRUITER';
    if (url === '/' || url.startsWith('/home') || url.startsWith('/candidate/')) {
      return 'CANDIDATE';
    }
    return null;
  }

  private redirectToLogin(attemptedUrl: string): void {
    if (attemptedUrl.startsWith('/employee')) {
      this.router.navigate(['/employee/login']);
    } else if (attemptedUrl.startsWith('/recruiter')) {
      this.router.navigate(['/recruiter/login']);
    } else {
      this.router.navigate(['/candidate/login']);
    }
  }

  private redirectToRoleHome(role: 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE'): void {
    const map = {
      EMPLOYEE: ['/employee/home'],
      RECRUITER: ['/recruiter'],
      CANDIDATE: ['/home'],
    };
    this.router.navigate(map[role]);
  }
}