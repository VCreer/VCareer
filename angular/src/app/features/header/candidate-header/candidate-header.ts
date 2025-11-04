import { Component, OnInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderTypeService } from '../../../core/services/header-type.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageToggleComponent } from '../../../shared/components/language-toggle/language-toggle';

@Component({
  selector: 'app-candidate-header',
  standalone: true,
  imports: [CommonModule, LanguageToggleComponent],
  templateUrl: './candidate-header.html',
  styleUrls: ['./candidate-header.scss']
})
export class CandidateHeaderComponent implements OnInit {
  @ViewChild('notificationContainer', { static: false }) notificationContainer?: ElementRef<HTMLElement>;
  currentRoute = '';
  isMenuOpen = false;
  selectedLanguage = 'vi';
  isLoggedIn = false;
  showProfileMenu = false;
  showNotificationMenu = false;
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
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  navigateToJobs() {
    this.router.navigate(['/candidate/job']);
    this.closeMobileMenu();
  }

  navigateToCompanies() {
    this.router.navigate(['/candidate/company']);
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

  onLoginSuccess() {
    this.navigationService.loginAsCandidate();
    this.closeMobileMenu();
  }

  navigateToRegister() {
    this.router.navigate(['/candidate/register']);
    this.closeMobileMenu();
  }

  navigateToRecruiter() {
    this.headerTypeService.switchToRecruiter();
    this.router.navigate(['/recruiter/about-us']);
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
    if (route === '/') {
      // Chỉ active khi đúng là trang chủ hoặc /home
      return this.currentRoute === '/' || this.currentRoute === '/home';
    }
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
    setTimeout(() => {
      this.showProfileMenu = false;
    }, 300);
  }

  toggleNotificationMenu() {
    this.showNotificationMenu = !this.showNotificationMenu;
    if (this.showNotificationMenu) {
      this.showProfileMenu = false; // Đóng profile menu khi mở notification
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    // Đóng menu nếu click ngoài khu vực notification
    if (this.showNotificationMenu && this.notificationContainer && !this.notificationContainer.nativeElement.contains(target)) {
      this.showNotificationMenu = false;
    }
  }

  markAllAsRead() {
    // Logic đánh dấu tất cả thông báo đã đọc
    console.log('Đánh dấu tất cả thông báo đã đọc');
    this.showNotificationMenu = false;
  }

  navigateToPersonalInfo() {
    this.router.navigate(['/candidate/profile']);
    this.showProfileMenu = false;
  }

  navigateToCvManagement() {
    this.router.navigate(['/candidate/cv-management']);
    this.showProfileMenu = false;
  }

  navigateToChangePassword() {
    this.router.navigate(['/candidate/change-password']);
    this.showProfileMenu = false;
  }
}
