import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { APP_CURRENT_USER_INITIALIZER } from './app/core/services/auth-Cookiebased/app-auth-initializer';
import '@angular/compiler'; // đoạn này là cố tình dùng để ko phải sửa theo angular bản mới nhất là các file phải .componrnt.ts

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
