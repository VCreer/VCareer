import { Routes } from '@angular/router';
import { customAuthGuard } from './guards/custom-auth.guard';

// Định nghĩa các route của ứng dụng
export const APP_ROUTES: Routes = [
  // Custom Account routes thay thế ABP Account module
  {
    path: 'account/login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent),
  },
  {
    path: 'account/register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent),
  },
  // Fallback routes
  {
    path: 'login',
    redirectTo: '/account/login',
    pathMatch: 'full'
  },
  {
    path: 'register', 
    redirectTo: '/account/register',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(c => c.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./home/home.component').then(c => c.HomeComponent),
      },
      // {
      //   path: 'account',
      //   loadChildren: () => import('@abp/ng.account').then(c => c.createRoutes()),
      // }, // Comment ABP Account routes
      {
        path: 'identity',
        loadChildren: () => import('@abp/ng.identity').then(c => c.createRoutes()),
      },
      {
        path: 'tenant-management',
        loadChildren: () => import('@abp/ng.tenant-management').then(c => c.createRoutes()),
      },
      {
        path: 'setting-management',
        loadChildren: () => import('@abp/ng.setting-management').then(c => c.createRoutes()),
      },
    ]
  },
];
