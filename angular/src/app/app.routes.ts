import { authGuard, permissionGuard } from '@abp/ng.core';
import { Routes } from '@angular/router';
import { EmployeeLoginComponent } from './features/Auth/Employee/login/login';
import { LoginComponent } from './features/Auth/Candidate/login/login';
import { CandidateRegisterComponent } from './features/Auth/Candidate/register/register';
import { RecruiterLoginComponent } from './features/Auth/Recruiter/login/login';
import { RecruiterRegisterComponent } from './features/Auth/Recruiter/register/register';
import { ForgotPasswordComponent, ResetPasswordComponent } from '@abp/ng.account';
import { VerifyOtpComponent } from './features/Auth/Common/verify-otp/verify-otp';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./home/home.component').then(c => c.HomeComponent),
  },
  {
    path: 'account',
    loadChildren: () => import('@abp/ng.account').then(c => c.createRoutes()),
  },
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
 {
   path: 'employee/login', component: EmployeeLoginComponent 
  },
  {
   path: 'candidate/login', component: LoginComponent
  },
  {
   path: 'candidate/register', component: CandidateRegisterComponent
  },
  {
   path: 'recruiter/login', component: RecruiterLoginComponent
  },
  {
   path: 'recruiter/register', component: RecruiterRegisterComponent 
  },
  {
   path: 'common/forgot-password', component: ForgotPasswordComponent
  },
  {
   path: 'common/reset-password', component: ResetPasswordComponent
  },
  {
   path: 'common/verify-otp', component: VerifyOtpComponent
  },
];

