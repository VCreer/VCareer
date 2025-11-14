// src/app/core/guards/auth-guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../core/services/auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from '../core/services/auth-Cookiebased/auth-facade.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private state: AuthStateService,
    private authFacade: AuthFacadeService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const user = this.state.user;
    if (user) {
      return of(this.checkRole(route, state, user));
    }

    return this.authFacade.loadCurrentUser().pipe(
      take(1),
      map(u => this.checkRole(route, state, u)),
      // errors handled by router/global error handler
    );
  }

  private checkRole(route: ActivatedRouteSnapshot, state: RouterStateSnapshot, user: any): boolean {
    if (!user) {
      this.redirectToLogin(state.url);
      return false;
    }

    const requiredRole = route.data['role'] as string | undefined;
    if (requiredRole && !(user.roles ?? []).includes(requiredRole)) {
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }

  private redirectToLogin(url: string) {
    if (url.includes('/recruiter')) this.router.navigate(['/recruiter/login']);
    else if (url.includes('/employee')) this.router.navigate(['/employee/login']);
    else this.router.navigate(['/candidate/login']);
  }
}
