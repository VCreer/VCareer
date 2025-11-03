import { RoutesService, eLayoutType } from '@abp/ng.core';
import { inject, provideAppInitializer } from '@angular/core';

// Provider cho cấu hình route
export const APP_ROUTE_PROVIDER = [
  provideAppInitializer(() => {
    configureRoutes();
  }),
];

// Cấu hình các route cho menu
function configureRoutes() {
  const routes = inject(RoutesService);
  routes.add([
    {
      path: '/',
      name: '::Menu:Home',
      iconClass: 'fas fa-home',
      order: 1,
      layout: eLayoutType.application,
    },
    {
      path: '/books',
      name: '::Menu:Books',
      iconClass: 'fas fa-book',
      layout: eLayoutType.application,
      requiredPolicy: 'VCareer.Books',
    },
    {
      path: '/employee/login',
      name: '::Menu:Employee Login',
      layout: eLayoutType.empty,
      order: 2,
    },
      {
      path: '/candidate/login',
      name: '::Menu:Candidate Login',
      layout: eLayoutType.empty,
      order: 3,
    },
      {
      path: '/candidate/register',
      name: '::Menu:Candidate Register',
      layout: eLayoutType.empty,
      order: 4,
    },
      {
      path: '/recruiter/login',
      name: '::Menu:Recruiter Login',
      layout: eLayoutType.empty,
      order: 5,
    },
       {
      path: '/recruiter/register',
      name: '::Menu:Recruiter Register',
      layout: eLayoutType.empty,
      order: 6,
    },
       {
      path: '/common/forgot-password',
      name: '::Menu:Forgot Password',
      layout: eLayoutType.empty,
      order: 7,
    },
      {
      path: '/common/reset-password',
      name: '::Menu:Reset Password',
      layout: eLayoutType.empty,
      order: 8,
    },
      {
      path: '/common/verify-otp',
      name: '::Menu:Verify Otp',
      layout: eLayoutType.empty,
      order: 9,
    },

  ]);
}
