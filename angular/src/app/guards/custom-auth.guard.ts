import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CustomAuthService } from '../services/custom-auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomAuthGuard implements CanActivate {
  constructor(
    private customAuthService: CustomAuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.customAuthService.isAuthenticated()) {
      this.customAuthService.navigateToLogin();
      return false;
    }
    return true;
  }
}