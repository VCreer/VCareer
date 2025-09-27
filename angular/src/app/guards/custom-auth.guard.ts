import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CustomAuthService } from '../services/custom-auth.service';

// Guard kiểm tra xác thực người dùng
export const customAuthGuard: CanActivateFn = (route, state) => {
  const customAuthService = inject(CustomAuthService);

  if (!customAuthService.isAuthenticated) {
    // Chuyển hướng đến trang đăng nhập tùy chỉnh thay vì ABP login
    customAuthService.navigateToLogin();
    return false;
  }

  return true;
};