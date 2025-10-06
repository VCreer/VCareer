import { Routes } from '@angular/router';

// Định nghĩa các route của ứng dụng
export const APP_ROUTES: Routes = [
  // Candidate routes
  {
    path: 'candidate/login',
    loadComponent: () => import('./features/auth/candidate/candidate-login/candidate-login.component').then(c => c.LoginComponent),
  },
  {
    path: 'candidate/register',
    loadComponent: () => import('./features/auth/candidate/candidate-regsiter/candidate-register.component').then(c => c.RegisterComponent),
  },
  {
    path: 'candidate/forget-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
  },
  {
    path: 'candidate/verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(c => c.VerifyOtpComponent),
  },
  {
    path: 'candidate/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(c => c.ResetPasswordComponent),
  },
  
  // Recruiter routes
  {
    path: 'recruiter/login',
    loadComponent: () => import('./features/auth/recruiter/recruiter-login/recruiter-login.component').then(c => c.RecruiterLoginComponent),
  },
  {
    path: 'recruiter/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
  },
  {
    path: 'recruiter/register',
    loadComponent: () => import('./features/auth/recruiter/recruiter-register/recruiter-register.component').then(c => c.RecruiterRegisterComponent),
  },
  {
    path: 'recruiter/verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(c => c.VerifyOtpComponent),
  },
  {
    path: 'recruiter/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(c => c.ResetPasswordComponent),
  },
  // Legacy routes - redirect to candidate routes
  {
    path: 'login',
    redirectTo: '/candidate/login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: '/candidate/register',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    redirectTo: '/candidate/forget-password',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(c => c.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/home.component').then(c => c.HomeComponent),
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