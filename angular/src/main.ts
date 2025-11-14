import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { APP_CURRENT_USER_INITIALIZER } from './app/core/services/auth-Cookiebased/app-auth-initializer';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers ?? [],
    APP_CURRENT_USER_INITIALIZER
  ]
});
