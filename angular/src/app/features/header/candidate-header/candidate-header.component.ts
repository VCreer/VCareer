import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderTypeService } from '../../../core/services/header-type.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageToggleComponent } from '../../../shared/components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-candidate-header',
  standalone: true,
  imports: [CommonModule, LanguageToggleComponent],
  templateUrl: './candidate-header.component.html',
  styleUrls: ['./candidate-header.component.scss']
})
export class CandidateHeaderComponent implements OnInit {
  currentRoute = '';
  isMenuOpen = false;
  selectedLanguage = 'vi';
  isLoggedIn = false;
  showProfileMenu = false;
  expandedSections = {
    jobManagement: true,
    cvManagement: true,
    emailSettings: false,
    personalSecurity: false,
    upgradeAccount: false
  };

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

    // Subscribe to authentication state changes
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
  }

  navigateToHome() {
    window.location.reload();
    this.closeMobileMenu();
  }

  navigateToJobs() {
    this.router.navigate(['/candidate/jobs']);
    this.closeMobileMenu();
  }

  navigateToCompanies() {
    this.router.navigate(['/candidate/companies']);
    this.closeMobileMenu();
  }

  navigateToAbout() {
    this.router.navigate(['/about']);
    this.closeMobileMenu();
  }

  navigateToContact() {
    this.router.navigate(['/contact']);
    this.closeMobileMenu();
  }

  navigateToLogin() {
    this.router.navigate(['/candidate/login']);
    this.closeMobileMenu();
  }

  // Method để xử lý đăng nhập thành công
  onLoginSuccess() {
    this.navigationService.loginAsCandidate();
    this.closeMobileMenu();
  }

  navigateToRegister() {
    this.router.navigate(['/candidate/register']);
    this.closeMobileMenu();
  }

  navigateToRecruiter() {
    console.log('🚀 navigateToRecruiter() called');
    // Chuyển sang recruiter header và navigate đến recruiter (vcareer.com/recruiter)
    this.headerTypeService.switchToRecruiter();
    console.log('✅ Header switched to recruiter');
    this.router.navigate(['/recruiter']);
    console.log('✅ Navigated to /recruiter');
    this.closeMobileMenu();
  }

  navigateToProfile() {
    this.router.navigate(['/candidate/profile']);
    this.closeMobileMenu();
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }

  onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
    this.translationService.setLanguage(lang);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }


  toggleSection(section: string) {
    this.expandedSections[section as keyof typeof this.expandedSections] = 
      !this.expandedSections[section as keyof typeof this.expandedSections];
  }

  logout() {
    this.navigationService.logout();
    this.showProfileMenu = false;
  }

  onProfileMouseLeave() {
    // Delay để user có thể di chuột vào menu
    setTimeout(() => {
      this.showProfileMenu = false;
    }, 300);
  }
}