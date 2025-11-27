import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  // Root route - Candidate Homepage
  {
    path: '',
    loadComponent: () => import('./layout/candidate-layout').then(c => c.CandidateLayoutComponent),
    children: [
      {
        path: 'identity',
        loadChildren: () => import('@abp/ng.identity').then(m => m.IdentityModule),
      },
      {
        path: 'setting-management',
        loadChildren: () =>
          import('@abp/ng.setting-management').then(m => m.SettingManagementModule),
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/homepage/candidate/candidate-homepage').then(
            c => c.CandidateHomepageComponent
          ),
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/dashboard/homepage/candidate/candidate-homepage').then(
            c => c.CandidateHomepageComponent
          ),
      },
      {
        path: 'candidate/profile',
        loadComponent: () =>
          import('./features/dashboard/profile/candidate/candidate-profile').then(
            c => c.CandidateProfileComponent
          ),
      },
      {
        path: 'candidate/cv-management',
        loadComponent: () => import('./features/cv-management/candidate/cv-management').then(c => c.CvManagementComponent),
      },
      {
        path: 'candidate/cv-management/view/:cvId',
        loadComponent: () =>
          import('./features/dashboard/cv-management/candidate/cv-view').then(
            c => c.CvViewComponent
          ),
      },
      {
        path: 'candidate/cv-management/uploaded/view/:id',
        loadComponent: () =>
          import('./features/dashboard/cv-management/candidate/uploaded-cv-view').then(
            c => c.UploadedCvViewComponent
          ),
      },
      {
        path: 'candidate/job',
        loadComponent: () => import('./features/job/candidate/job').then(c => c.JobComponent),
      },
      {
        path: 'candidate/job-detail/:id',
        loadComponent: () =>
          import('./features/job-detail/candidate/job-detail').then(c => c.JobDetailComponent),
      },
      {
        path: 'candidate/company',
        loadComponent: () =>
          import('./features/dashboard/company/candidate/company-listing').then(
            c => c.CompanyListingComponent
          ),
      },
      {
        path: 'candidate/companies',
        redirectTo: 'candidate/company',
        pathMatch: 'full',
      },
      {
        path: 'candidate/company-detail/:id',
        loadComponent: () =>
          import('./features/dashboard/company-detail/candidate/company-detail').then(
            c => c.CompanyDetailComponent
          ),
      },
      {
        path: 'candidate/change-password',
        loadComponent: () =>
          import('./features/dashboard/change-password/candidate/change-password').then(
            c => c.ChangePasswordComponent
          ),
      },
      {
        path: 'candidate/cv-sample',
        loadComponent: () =>
          import('./features/dashboard/cv-sample/candidate/cv-sample').then(
            c => c.CvSampleComponent
          ),
      },
      {
        path: 'candidate/write-cv/:templateId',
        loadComponent: () =>
          import('./features/dashboard/write-cv/candidate/write-cv').then(c => c.WriteCv),
      },
      {
        path: 'candidate/save-jobs',
        loadComponent: () =>
          import('./features/dashboard/save-jobs/candidate/saved-jobs').then(
            c => c.SavedJobsComponent
          ),
      },
      {
        path: 'candidate/about-us',
        loadComponent: () =>
          import('./features/dashboard/about-us/candidate/about-us').then(
            c => c.CandidateAboutUsComponent
          ),
      },
      {
        path: 'candidate/contact',
        loadComponent: () =>
          import('./features/contact/candidate/contact').then(c => c.ContactComponent),
      },
      {
        path: 'candidate/applied-jobs',
        loadComponent: () =>
          import('./features/dashboard/applied-jobs/candidate/applied-jobs').then(
            c => c.AppliedJobsComponent
          ),
      },
      {
        path: 'candidate/service',
        loadComponent: () =>
          import('./features/dashboard/service/candidate/service').then(
            c => c.CandidateServiceComponent
          ),
      },
      {
        path: 'candidate/upgrade-account/pay',
        loadComponent: () =>
          import('./features/dashboard/upgrade-account/candidate/upgrade-account-pay').then(
            c => c.UpgradeAccountPayComponent
          ),
      },
    ],
  },

  //#region  auth route
  {
    path: 'candidate/login',
    loadComponent: () =>
      import('./features/Auth/candidate/candidate-login/candidate-login').then(
        c => c.LoginComponent
      ),
  },
  {
    path: 'candidate/register',
    loadComponent: () =>
      import('./features/Auth/candidate/candidate-regsiter/candidate-register').then(
        c => c.RegisterComponent
      ),
  },
  {
    path: 'candidate/forget-password',
    loadComponent: () =>
      import('./features/Auth/forgot-password/forgot-password').then(
        c => c.ForgotPasswordComponent
      ),
  },
  {
    path: 'candidate/verify-otp',
    loadComponent: () =>
      import('./features/Auth/verify-otp/verify-otp').then(c => c.VerifyOtpComponent),
  },
  {
    path: 'candidate/reset-password',
    loadComponent: () =>
      import('./features/Auth/reset-password/reset-password').then(c => c.ResetPasswordComponent),
  },

  {
    path: 'recruiter/login',
    loadComponent: () =>
      import('./features/Auth/recruiter/recruiter-login/recruiter-login').then(
        c => c.RecruiterLoginComponent
      ),
  },
  {
    path: 'recruiter/register',
    loadComponent: () =>
      import('./features/Auth/recruiter/recruiter-register/recruiter-register').then(
        c => c.RecruiterRegisterComponent
      ),
  },
  {
    path: 'recruiter/forgot-password',
    loadComponent: () =>
      import('./features/Auth/forgot-password/forgot-password').then(
        c => c.ForgotPasswordComponent
      ),
  },
  {
    path: 'recruiter/verify-otp',
    loadComponent: () =>
      import('./features/Auth/verify-otp/verify-otp').then(c => c.VerifyOtpComponent),
  },
  {
    path: 'recruiter/reset-password',
    loadComponent: () =>
      import('./features/Auth/reset-password/reset-password').then(c => c.ResetPasswordComponent),
  },

  // Employee login route (must be before all employee routes)
  {
    path: 'employee/login',
    loadComponent: () =>
      import('./features/Auth/admin/login/employee-login').then(m => m.EmployeeLoginComponent),
  },
  //#endregion

  //#region  Recruiter main route
  {
    path: 'recruiter',
    loadComponent: () => import('./layout/candidate-layout').then(c => c.CandidateLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/homepage/candidate/candidate-homepage').then(
            c => c.CandidateHomepageComponent
          ),
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./features/dashboard/about-us/recruiter/about-us').then(c => c.AboutUs),
      },
      {
        path: 'service',
        loadComponent: () =>
          import('./features/dashboard/about-us/recruiter/about-us').then(c => c.AboutUs),
      },
      {
        path: 'job-posting',
        loadComponent: () =>
          import('./features/dashboard/job-posting/recruiter/job-posting').then(
            c => c.JobPostingComponent
          ),
      },
      {
        path: 'recruiter-verify',
        loadComponent: () =>
          import('./features/Auth/recruiter/recruiter-verify-otp/recruiter-verify-otp').then(
            c => c.RecruiterVerifyOtpComponent
          ),
      },    
      {
        path: 'hr-staff-management',
        loadComponent: () => import('./features/dashboard/hr-staff-management/recruiter/hr-staff-management').then(c => c.HRStaffManagementComponent),
      },
      {
        path: 'recruitment-report',
        loadComponent: () => import('./features/dashboard/recruitment-report/recruiter/recruitment-report').then(c => c.RecruitmentReportComponent),
      },
      {
        path: 'recruiter-setting',
        loadComponent: () =>
          import('./features/dashboard/setting/recruiter/recruiter-setting').then(
            c => c.RecruiterSettingComponent
          ),
      },
      {
        path: 'cv-management',
        loadComponent: () =>
          import('./features/cv-management/recruiter/cv-management').then(
            c => c.RecruiterCvManagementComponent
          ),
      },
      {
        path: 'cv-management-detail',
        loadComponent: () =>
          import('./features/dashboard/cv-management-detail/recruiter/cv-management-detail').then(
            c => c.CvManagementDetailComponent
          ),
      },
      {
        path: 'recruitment-campaign',
        loadComponent: () =>
          import('./features/dashboard/recruitment-campaign/recruiter/recruitment-campaign').then(
            c => c.RecruitmentCampaignComponent
          ),
      },
      {
        path: 'campaign-detail',
        loadComponent: () =>
          import('./features/dashboard/campaign/recruiter/campaign-detail').then(
            c => c.CampaignDetailComponent
          ),
      },
      {
        path: 'campaign-job-management',
        loadComponent: () => import('./features/dashboard/campaign-job-management/recruiter/campaign-job-management').then(c => c.CampaignJobManagementComponent),
      },
      {
        path: 'campaign-job-management-view-cv',
        loadComponent: () => import('./features/dashboard/campaign-job-management-view-cv/recruiter/campaign-job-management-view-cv').then(c => c.CampaignJobManagementViewCvComponent),
      },
      {
        path: 'buy-services',
        loadComponent: () =>
          import('./features/dashboard/buy-service/recruiter/buy-services').then(
            c => c.BuyServicesComponent
          ),
      },
      {
        path: 'buy-services/detail/:id',
        loadComponent: () =>
          import('./features/dashboard/buy-service-detail/recruiter/buy-service-detail').then(
            c => c.BuyServiceDetailComponent
          ),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/recruiter/cart').then(c => c.CartComponent),
      },
      {
        path: 'my-services',
        loadComponent: () => import('./features/dashboard/service/recruiter/my-services').then(c => c.MyServicesComponent),
      },
      {
        path: 'recruitment-report',
        loadComponent: () =>
          import('./features/dashboard/recruitment-report/recruiter/recruitment-report').then(
            c => c.RecruitmentReportComponent
          ),
      },
      {
        path: 'hr-staff-management',
        loadComponent: () =>
          import('./features/dashboard/hr-staff-management/recruiter/hr-staff-management').then(
            c => c.HRStaffManagementComponent
          ),
      },
      // {
      //   path: 'performance-dashboard',
      //   loadComponent: () => import('./features/dashboard/recruitment-performance/recruitment-performance-dashboard.component').then(c => c.RecruitmentPerformanceDashboardComponent),
      // }
    ],
  },
  //#endregion

  //#region  Employee main route with layout (must be after login route)
  {
    path: 'employee',
    loadComponent: () =>
      import('./layout/employee/employee-layout').then(c => c.EmployeeLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/dashboard/homepage/employee/employee-home').then(
            c => c.EmployeeHomeComponent
          ),
      },
      {
        path: 'manage-recruitment-information',
        loadComponent: () =>
          import(
            './features/dashboard/manage-recruitment-information/employee/employee-job-management'
          ).then(c => c.EmployeeJobManagementComponent),
      },
      {
        path: 'manage-recruitment-information-detail',
        loadComponent: () =>
          import(
            './features/dashboard/manage-recruitment-information-detail/employee/employee-job-management-detail'
          ).then(c => c.EmployeeJobManagementDetailComponent),
      },
      {
        path: 'company-verify',
        loadComponent: () =>
          import(
            './features/dashboard/company-verify/employee/company-verify'
          ).then(c => c.CompanyVerifyComponent),
      },
    ],
  },
  //#endregion

  //#region  ABP routes
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
  //#endregion

  //#region  404 - Wildcard route (phải đặt cuối cùng)
  {
    path: '404',
    loadComponent: () => import('./features/not-found/not-found').then(c => c.NotFoundComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
  //#endregion
];
