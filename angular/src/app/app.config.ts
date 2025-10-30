import { provideAbpCore, withOptions } from '@abp/ng.core';
import { provideAbpOAuth } from '@abp/ng.oauth';
import { provideSettingManagementConfig } from '@abp/ng.setting-management/config';
import { provideFeatureManagementConfig } from '@abp/ng.feature-management';
import { provideAbpThemeShared } from '@abp/ng.theme.shared';
import { provideIdentityConfig } from '@abp/ng.identity/config';
// import { provideAccountConfig } from '@abp/ng.account/config';
import { provideTenantManagementConfig } from '@abp/ng.tenant-management/config';
import { registerLocale } from '@abp/ng.core/locale';
import { provideThemeLeptonX } from '@abp/ng.theme.lepton-x';
import { provideSideMenuLayout } from '@abp/ng.theme.lepton-x/layouts';
import { provideLogo, withEnvironmentOptions } from '@volo/ngx-lepton-x.core';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from '../environments/environment';
import { APP_ROUTES } from './app.routes';
import { APP_ROUTE_PROVIDER } from './route.provider';
import { MockApiInterceptor } from './proxy/mock-api/mock-api.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthMockService } from './proxy/mock-api/services/auth-mock.service';
import { CandidateMockService } from './proxy/mock-api/services/candidate-mock.service';
import { RecruiterMockService } from './proxy/mock-api/services/recruiter-mock.service';
import { JobMockService } from './proxy/mock-api/services/job-mock.service';
import { ProfileMockService } from './proxy/mock-api/services/profile-mock.service';
// import { AuthService } from '@abp/ng.core';
// import { CustomAuthService } from './services/custom-auth.service';

// Cấu hình chính của ứng dụng
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    APP_ROUTE_PROVIDER,
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAbpCore(
      withOptions({
        environment,
        registerLocaleFn: registerLocale(),
      })
    ),
    provideAbpOAuth(),
    provideIdentityConfig(),
    provideSettingManagementConfig(),
    provideFeatureManagementConfig(),
    provideThemeLeptonX(),
    provideSideMenuLayout(),
    provideLogo(withEnvironmentOptions(environment)),
    // provideAccountConfig(), // Comment ABP Account module
    provideTenantManagementConfig(),
    provideAbpThemeShared(),
    // Mock API chỉ bật khi environment.useMockApi = true
    ...(environment.useMockApi ? [
      AuthMockService,
      CandidateMockService,
      RecruiterMockService,
      JobMockService,
      ProfileMockService,
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MockApiInterceptor,
        multi: true
      }
    ] : []),
    // Comment override AuthService để tránh circular dependency
    // {
    //   provide: AuthService,
    //   useClass: CustomAuthService
    // }
  ],
};
