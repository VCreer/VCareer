import { provideAbpCore, withOptions } from '@abp/ng.core';
import { provideAbpOAuth } from '@abp/ng.oauth';
import { provideSettingManagementConfig } from '@abp/ng.setting-management/config';
import { provideFeatureManagementConfig } from '@abp/ng.feature-management';
import { provideAbpThemeShared, withHttpErrorConfig } from '@abp/ng.theme.shared';
import { provideIdentityConfig } from '@abp/ng.identity/config';
// import { provideAccountConfig } from '@abp/ng.account/config';
import { provideTenantManagementConfig } from '@abp/ng.tenant-management/config';
import { registerLocale } from '@abp/ng.core/locale';
import { provideThemeLeptonX } from '@abp/ng.theme.lepton-x';
import { provideSideMenuLayout } from '@abp/ng.theme.lepton-x/layouts';
import { provideLogo, withEnvironmentOptions } from '@volo/ngx-lepton-x.core';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { CredentialsInterceptor } from './core/interceptors/credential.interceptor';
import {
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SOCIAL_AUTH_CONFIG,
} from '@abacritt/angularx-social-login';
import { environment } from '../environments/environment';
import { APP_ROUTES } from './app.routes';
import { APP_ROUTE_PROVIDER } from './route.provider';
// import { MockApiInterceptor } from './proxy/mock-api/mock-api.interceptor';
// import { HTTP_INTERCEPTORS } from '@angular/common/http';
// import { AuthMockService } from './proxy/mock-api/services/auth-mock.service';
// import { CandidateMockService } from './proxy/mock-api/services/candidate-mock.service';
// import { RecruiterMockService } from './proxy/mock-api/services/recruiter-mock.service';
// import { JobMockService } from './proxy/mock-api/services/job-mock.service';
// import { ProfileMockService } from './proxy/mock-api/services/profile-mock.service';
// import { AuthService } from '@abp/ng.core';
// import { CustomAuthService } from './services/custom-auth.service';

// Cấu hình chính của ứng dụng
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    APP_ROUTE_PROVIDER,
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '1016101725161-2vljk9oo68oq4oj5q7b4o6ofdj1hn539.apps.googleusercontent.com'
            ),
          },
        ],
      } as SocialAuthServiceConfig,
    },
       {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideAbpCore(
      withOptions({
        environment,
        registerLocaleFn: registerLocale(),
      })
    ),
    provideAbpOAuth(), // Giữ lại để tránh lỗi InjectionToken, lỗi 404 openid-configuration không ảnh hưởng
    provideIdentityConfig(),
    provideSettingManagementConfig(),
    provideFeatureManagementConfig(),
    provideThemeLeptonX(),
    provideSideMenuLayout(),
    provideLogo(withEnvironmentOptions(environment)),
    // provideAccountConfig(), // Comment ABP Account module
    provideTenantManagementConfig(),
    provideAbpThemeShared(
      withHttpErrorConfig({
        // Skip showing default ABP error modal for 404s to avoid intrusive popups on landing page
        skipHandledErrorCodes: [404],
      })
    ),
    // Mock API Services (chỉ khi useMockApi = true)
    // ...(environment.useMockApi ? [
    //   AuthMockService,
    //   CandidateMockService,
    //   RecruiterMockService,
    //   JobMockService,
    //   ProfileMockService,
    // ] : []),
    // // Mock API Interceptor (chỉ khi useMockApi = true)
    // ...(environment.useMockApi ? [{
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: MockApiInterceptor,
    //   multi: true,
    // }] : []),
    // Auth Interceptor - Tự động gắn token vào mọi request
 
    // Comment override AuthService để tránh circular dependency
    // {
    //   provide: AuthService,
    //   useClass: CustomAuthService
    // }
  ],
};
