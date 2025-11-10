import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderWrapperComponent } from '../features/header/header-wrapper';
import { FooterComponent } from '../features/footer/footer';
import { NavigationService } from '../core/services/navigation.service';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderWrapperComponent, FooterComponent],
  templateUrl: './candidate-layout.html',
  styleUrls: ['./candidate-layout.scss']
})
export class CandidateLayoutComponent implements OnInit {
  showFooter: boolean = true;

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

    // Hide footer if recruiter is logged in and on recruiter routes
    if (isLoggedIn && userRole === 'recruiter' && currentUrl.startsWith('/recruiter')) {
      this.showFooter = false;
    } else {
      this.showFooter = true;
    }
  }
}
