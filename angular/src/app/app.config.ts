import { provideAbpCore, withOptions } from '@abp/ng.core';
import { provideSettingManagementConfig } from '@abp/ng.setting-management/config';
import { provideFeatureManagementConfig } from '@abp/ng.feature-management';
import { provideAbpThemeShared, withHttpErrorConfig } from '@abp/ng.theme.shared';
import { provideIdentityConfig } from '@abp/ng.identity/config';
import { provideTenantManagementConfig } from '@abp/ng.tenant-management/config';
import { registerLocale } from '@abp/ng.core/locale';
import { provideThemeLeptonX } from '@abp/ng.theme.lepton-x';
import { provideSideMenuLayout } from '@abp/ng.theme.lepton-x/layouts';
import { provideLogo, withEnvironmentOptions } from '@volo/ngx-lepton-x.core';
import { ApplicationConfig, provideZoneChangeDetection, InjectionToken } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
//import { NAVIGATE_TO_MANAGE_PROFILE } from '@abp/ng.core'; 
import { provideAbpOAuth } from '@abp/ng.oauth'; 

import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { APP_CURRENT_USER_INITIALIZER } from './core/services/auth-Cookiebased/app-auth-initializer';

import {
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SOCIAL_AUTH_CONFIG,
} from '@abacritt/angularx-social-login';
import { environment } from '../environments/environment';
import { APP_ROUTES } from './app.routes';
import { APP_ROUTE_PROVIDER } from './route.provider';


export const NAVIGATE_TO_MANAGE_PROFILE = new InjectionToken<() => void>('NAVIGATE_TO_MANAGE_PROFILE');


export const appConfig: ApplicationConfig = {
  providers: [
    // 1. ABP Core
    provideAbpCore(
      withOptions({
        environment,
        registerLocaleFn: registerLocale(),
      })
    ),
        provideAbpOAuth(),

    // 2. Zone & Animations
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),

    // 3. HTTP Client
    provideHttpClient(
      withInterceptors([authInterceptor]),
    ),

    // 4. Router
    provideRouter(APP_ROUTES),
    APP_ROUTE_PROVIDER,

    // 5. ABP Modules
    provideAbpThemeShared(
      withHttpErrorConfig({
        skipHandledErrorCodes: [401, 404],
      })
    ),
    provideIdentityConfig(),
    provideSettingManagementConfig(),
    provideFeatureManagementConfig(),
    provideThemeLeptonX(),
    provideSideMenuLayout(),
    provideLogo(withEnvironmentOptions(environment)),
    provideTenantManagementConfig(),

    // ✅ 6. THÊM: NAVIGATE_TO_MANAGE_PROFILE provider
    {
      provide: NAVIGATE_TO_MANAGE_PROFILE,
      useFactory: (router: Router) => {
        return () => {
          const currentUrl = router.url;
          console.log('[Navigation] Navigate to profile from:', currentUrl);
          
          if (currentUrl.startsWith('/employee')) {
            router.navigate(['/employee/home']);
          } else if (currentUrl.startsWith('/recruiter')) {
            router.navigate(['/recruiter/recruiter-setting']);
          } else {
            router.navigate(['/candidate/profile']);
          }
        };
      },
      deps: [Router],
    },

    // 7. Google OAuth
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
    //load curent user
   APP_CURRENT_USER_INITIALIZER,
  ],
};