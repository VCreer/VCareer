import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  // Root route - Candidate Homepage
  {
    path: '',
    loadComponent: () => import('./layout/candidate-layout.component').then(c => c.CandidateLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/homepage/candidate/candidate-homepage.component').then(c => c.CandidateHomepageComponent),
      },
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/homepage/candidate/candidate-homepage.component').then(c => c.CandidateHomepageComponent),
      },
      {
        path: 'candidate/profile',
        loadComponent: () => import('./features/dashboard/profile/candidate/candidate-profile.component').then(c => c.CandidateProfileComponent),
      }
    ]
  },

  // Auth routes (standalone - no layout)
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
  
  {
    path: 'recruiter/login',
    loadComponent: () => import('./features/auth/recruiter/recruiter-login/recruiter-login.component').then(c => c.RecruiterLoginComponent),
  },
  {
    path: 'recruiter/register',
    loadComponent: () => import('./features/auth/recruiter/recruiter-register/recruiter-register.component').then(c => c.RecruiterRegisterComponent),
  },
  {
    path: 'recruiter/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
  },
  {
    path: 'recruiter/verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(c => c.VerifyOtpComponent),
  },
  {
    path: 'recruiter/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(c => c.ResetPasswordComponent),
  },
  
  // Recruiter main route
  {
    path: 'recruiter',
    loadComponent: () => import('./layout/candidate-layout.component').then(c => c.CandidateLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/homepage/recruiter/recruiter-homepage.component').then(c => c.RecruiterHomepageComponent),
      }
    ]
  },
  
  {
    path: 'admin/login',
    loadComponent: () => import('./features/auth/admin/login/admin-login.component').then(c => c.AdminLoginComponent),
  },

  // Legacy redirects
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

  // ABP routes
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
];