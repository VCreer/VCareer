import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderTypeService } from '../../../core/services/header-type.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageToggleComponent } from '../../../shared/components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-recruiter-header',
  standalone: true,
  imports: [CommonModule, LanguageToggleComponent],
  templateUrl: './recruiter-header.component.html',
  styleUrls: ['./recruiter-header.component.scss']
})
export class RecruiterHeaderComponent implements OnInit {
  currentRoute = '';
  isMenuOpen = false;
  selectedLanguage = 'vi';

  constructor(
    private router: Router,
    private headerTypeService: HeaderTypeService,
    private navigationService: NavigationService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Subscribe to language changes
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  navigateToHome() {
    window.location.reload();
    this.closeMobileMenu();
  }

  navigateToAbout() {
    this.router.navigate(['/about']);
    this.closeMobileMenu();
  }

  navigateToServices() {
    this.router.navigate(['/services']);
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

  // Method để xử lý đăng nhập thành công
  onLoginSuccess() {
    this.navigationService.loginAsRecruiter();
    this.closeMobileMenu();
  }

  navigateToPostJob() {
    this.router.navigate(['/recruiter/post-job']);
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
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }
}
