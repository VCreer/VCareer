import { Routes } from '@angular/router';

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
  // Direct routes
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent),
  },
  {
    path: 'register', 
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
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
