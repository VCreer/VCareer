import { Component } from '@angular/core';
import { DynamicLayoutComponent } from '@abp/ng.core';

// Component layout chính của ứng dụng
@Component({
  selector: 'app-main-layout',
  template: `
    <abp-dynamic-layout />
  `,
  imports: [DynamicLayoutComponent],
})
export class MainLayoutComponent {}