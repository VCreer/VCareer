// src/app/guards/auth-redirect.guard.ts
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
 * AuthRedirectGuard - Dùng cho trang login/register
 * Nếu user đã login → redirect về trang home tương ứng
 * Nếu chưa login → cho phép truy cập
 */
@Injectable({ providedIn: 'root' })
export class AuthRedirectGuard implements CanActivate {
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
        // Nếu chưa login → cho phép vào trang login/register
        if (!user) {
          return true;
        }

        // Nếu đã login → redirect về home
        const role = getPrimaryRoutingRole(user.roles ?? []);
        
        if (role) {
          this.redirectToRoleHome(role);
        } else {
          // Nếu không có role hợp lệ → cho logout
          this.router.navigate(['/candidate/login']);
        }
        
        return false;
      })
    );
  }

  private redirectToRoleHome(role: 'EMPLOYEE' | 'RECRUITER' | 'CANDIDATE'): void {
    const map = {
      EMPLOYEE: ['/employee/statistical-reports'],
      RECRUITER: ['recruiter/recruitment-report'],
      CANDIDATE: ['/home'],
    };
    this.router.navigate(map[role]);
  }
}