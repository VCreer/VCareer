import { Component } from '@angular/core';
import { DynamicLayoutComponent } from '@abp/ng.core';
import { LoaderBarComponent } from '@abp/ng.theme.shared';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar />
    <router-outlet />
  `,
  imports: [LoaderBarComponent, RouterOutlet],
})
export class AppComponent {}
