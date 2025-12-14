import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-recruiter-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-header.html',
  styleUrls: ['./recruiter-header.scss']
})
export class RecruiterHeaderComponent implements OnInit {
  currentRoute = '';
  isMenuOpen = false;
  isLoggedIn = false;

  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.currentRoute = this.router.url;
    
    // Initialize isLoggedIn with current value
    const serviceLoggedIn = this.navigationService.isLoggedIn();
    const userRole = this.navigationService.getCurrentRole();
    this.isLoggedIn = serviceLoggedIn && userRole === 'recruiter';
    
    // Subscribe to login state changes
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      const userRole = this.navigationService.getCurrentRole();
      this.isLoggedIn = isLoggedIn && userRole === 'recruiter';
    });
    
    // Subscribe to role changes
    this.navigationService.userRole$.subscribe(role => {
      const serviceLoggedIn = this.navigationService.isLoggedIn();
      this.isLoggedIn = serviceLoggedIn && role === 'recruiter';
    });
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        // Update login state on route change
        const serviceLoggedIn = this.navigationService.isLoggedIn();
        const userRole = this.navigationService.getCurrentRole();
        this.isLoggedIn = serviceLoggedIn && userRole === 'recruiter';
      });
  }

  navigateToHome() {
    this.router.navigate(['/recruiter/about-us']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.closeMobileMenu();
  }

  navigateToAbout() {
    this.router.navigate(['/recruiter/about-us']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.closeMobileMenu();
  }

  navigateToServices() {
    this.router.navigate(['/recruiter/service']);
    this.closeMobileMenu();
  }

  navigateToPricing() {
    this.router.navigate(['/recruiter/service-quotation']);
    this.closeMobileMenu();
  }

  navigateToSupport() {
    this.router.navigate(['/support']);
    this.closeMobileMenu();
  }

  navigateToBlog() {
    this.router.navigate(['/blog']);
    this.closeMobileMenu();
  }

  navigateToLogin() {
    this.router.navigate(['/recruiter/login']);
    this.closeMobileMenu();
  }

  onLoginSuccess() {
    this.navigationService.loginAsRecruiter();
    this.closeMobileMenu();
  }

  navigateToPostJob() {
    if (!this.navigationService.isLoggedIn()) {
      this.router.navigate(['/recruiter/login']);
    } else {
      // Navigate to recruitment-report page
      this.router.navigate(['/recruiter/recruitment-report']);
    }
    this.closeMobileMenu();
  }


  navigateToDashboard() {
    this.router.navigate(['/recruiter/dashboard']);
    this.closeMobileMenu();
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  isActiveRoute(route: string): boolean {
    if (route === '/') {
      return this.currentRoute === '/' || this.currentRoute === '/home';
    }
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }
}
