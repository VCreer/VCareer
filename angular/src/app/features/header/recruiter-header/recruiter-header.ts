import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageToggleComponent } from '../../../shared/components/language-toggle/language-toggle';

@Component({
  selector: 'app-recruiter-header',
  standalone: true,
  imports: [CommonModule, LanguageToggleComponent],
  templateUrl: './recruiter-header.html',
  styleUrls: ['./recruiter-header.scss']
})
export class RecruiterHeaderComponent implements OnInit {
  currentRoute = '';
  isMenuOpen = false;
  selectedLanguage = 'vi';

  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.currentRoute = this.router.url;
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
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
    this.router.navigate(['/pricing']);
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
      // Route post-job chưa được implement
      // Nếu đã verified, không làm gì (hoặc có thể navigate đến home khi route được implement)
      // Nếu chưa verified, navigate đến verify page
      const isVerified = this.navigationService.isVerified();
      if (!isVerified) {
        this.router.navigate(['/recruiter/recruiter-verify']);
      }
      // TODO: Navigate to /recruiter/post-job when route is implemented
      // For now, if already verified, do nothing or show message
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

  onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
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
