import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderWrapperComponent } from '../features/header/header-wrapper';
import { FooterComponent } from '../features/footer/candidate/footer';
import { RecruiterFooterComponent } from '../features/footer/recruiter/footer';
import { NavigationService } from '../core/services/navigation.service';
import { ToastContainerComponent } from '../shared/components/toast-container/toast-container';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderWrapperComponent,
    FooterComponent,
    RecruiterFooterComponent,
    ToastContainerComponent,
  ],
  templateUrl: './candidate-layout.html',
  styleUrls: ['./candidate-layout.scss']
})
export class CandidateLayoutComponent implements OnInit {
  showFooter: boolean = true;
  useRecruiterFooter: boolean = false;

  constructor(
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.updateFooterVisibility();
    
    // Update footer visibility on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateFooterVisibility();
      });

    // Update footer visibility when login state changes
    this.navigationService.isLoggedIn$.subscribe(() => {
      this.updateFooterVisibility();
    });
  }

  private updateFooterVisibility() {
    const userRole = this.navigationService.getCurrentRole();
    const isLoggedIn = this.navigationService.isLoggedIn();
    const currentUrl = this.router.url;

    const recruiterMarketingRoutes = [
      '/recruiter/about-us',
      '/recruiter/service',
      '/recruiter/service-price-list',
      '/recruiter/terms-of-service',
    ];

    const isRecruiterMarketing = recruiterMarketingRoutes.some(route =>
      currentUrl.startsWith(route)
    );

    // Choose footer type
    this.useRecruiterFooter = isRecruiterMarketing || currentUrl.startsWith('/recruiter');

    // Hide footer only for recruiter dashboards (authenticated, non-marketing)
    if (isLoggedIn && userRole === 'recruiter' && currentUrl.startsWith('/recruiter')) {
      this.showFooter = isRecruiterMarketing;
    } else {
      this.showFooter = true;
    }
  }
}
