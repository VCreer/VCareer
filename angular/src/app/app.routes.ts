import { authGuard, permissionGuard } from '@abp/ng.core';
import { Routes } from '@angular/router';
import { EmployeeLoginComponent } from './Auth/Employee/login/login';

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
    path: 'books',
    loadComponent: () => import('./book/book.component').then(c => c.BookComponent),
    canActivate: [authGuard, permissionGuard],
  },
 {
   path: 'admin/login', component: EmployeeLoginComponent 
  },
];

