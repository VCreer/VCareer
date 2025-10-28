import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  // Root route - Candidate Homepage
  {
    path: '',
    loadComponent: () => import('./layout/candidate-layout').then(c => c.CandidateLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/homepage/candidate/candidate-homepage').then(c => c.CandidateHomepageComponent),
      },
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/homepage/candidate/candidate-homepage').then(c => c.CandidateHomepageComponent),
      },
      {
        path: 'candidate/profile',
        loadComponent: () => import('./features/dashboard/profile/candidate/candidate-profile').then(c => c.CandidateProfileComponent),
      },
      {
        path: 'candidate/cv-management',
        loadComponent: () => import('./features/dashboard/cv-management/candidate/cv-management').then(c => c.CvManagementComponent),
      },
      {
        path: 'candidate/cv-sample',
        loadComponent: () => import('./features/dashboard/cv-sample/candidate/cv-sample').then(c => c.CvSampleComponent),
      },
      {
        path: 'candidate/write-cv/:type',
        loadComponent: () => import('./features/dashboard/write-cv/candidate/write-cv').then(c => c.WriteCv),
      },
      {
        path: 'candidate/job',
        loadComponent: () => import('./features/dashboard/job/candidate/job').then(c => c.JobComponent),
      },
      {
        path: 'candidate/job-detail',
        loadComponent: () => import('./features/dashboard/job-detail/candidate/job-detail').then(c => c.JobDetailComponent),
      }
    ]
  },

  // Auth routes (standalone - no layout)
  {
    path: 'candidate/login',
    loadComponent: () => import('./features/auth/candidate/candidate-login/candidate-login').then(c => c.LoginComponent),
  },
  {
    path: 'candidate/register',
    loadComponent: () => import('./features/auth/candidate/candidate-regsiter/candidate-register').then(c => c.RegisterComponent),
  },
  {
    path: 'candidate/forget-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(c => c.ForgotPasswordComponent),
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
    loadComponent: () => import('./features/auth/recruiter/recruiter-login/recruiter-login').then(c => c.RecruiterLoginComponent),
  },
  {
    path: 'recruiter/register',
    loadComponent: () => import('./features/auth/recruiter/recruiter-register/recruiter-register').then(c => c.RecruiterRegisterComponent),
  },
  {
    path: 'recruiter/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(c => c.ForgotPasswordComponent),
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
    loadComponent: () => import('./layout/candidate-layout').then(c => c.CandidateLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/homepage/candidate/candidate-homepage').then(c => c.CandidateHomepageComponent),
      },
      {
        path: 'about-us',
        loadComponent: () => import('./features/dashboard/about-us/recruiter/about-us').then(c => c.AboutUs),
      }
    ]
  },
  
  {
    path: 'admin/login',
    loadComponent: () => import('./features/auth/admin/login/admin-login').then(c => c.AdminLoginComponent),
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
