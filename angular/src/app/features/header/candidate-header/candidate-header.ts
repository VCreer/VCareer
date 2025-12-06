import { Component, OnInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderTypeService } from '../../../core/services/header-type.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthStateService } from '../../../core/services/auth-Cookiebased/auth-state.service';

@Component({
  selector: 'app-candidate-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-header.html',
  styleUrls: ['./candidate-header.scss']
})
export class CandidateHeaderComponent implements OnInit {
  @ViewChild('notificationContainer', { static: false }) notificationContainer?: ElementRef<HTMLElement>;
  currentRoute = '';
  isMenuOpen = false;
  isLoggedIn = false;
  showProfileMenu = false;
  showNotificationMenu = false;
  currentUser: any = null;
  selectedLanguage: string = '';
  expandedSections = {
    jobManagement: true,
    cvManagement: true,
    personalSecurity: false
  };

  constructor(
    private router: Router,
    private headerTypeService: HeaderTypeService,
    private navigationService: NavigationService,
    private translationService: TranslationService,
    private authStateService: AuthStateService
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

    // Load current user on init
    this.currentUser = this.authStateService.user;
    
    // Initialize isLoggedIn with current value - check both service and valid user
    const serviceLoggedIn = this.navigationService.isLoggedIn();
    const hasValidUser = this.isValidUser(this.currentUser);
    this.isLoggedIn = serviceLoggedIn && hasValidUser;
    
    console.log('[CandidateHeader] OnInit - serviceLoggedIn:', serviceLoggedIn, 'hasValidUser:', hasValidUser, 'isLoggedIn:', this.isLoggedIn);
    
    // Subscribe to authentication state changes
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      console.log('[CandidateHeader] isLoggedIn changed to:', isLoggedIn);
      // Only update if we also have a valid user, otherwise force to false
      const currentUser = this.authStateService.user;
      const hasValidUser = this.isValidUser(currentUser);
      this.isLoggedIn = isLoggedIn && hasValidUser;
      console.log('[CandidateHeader] Updated isLoggedIn to:', this.isLoggedIn, 'hasValidUser:', hasValidUser);
    });

    // Subscribe to current user changes
    this.authStateService.user$.subscribe(user => {
      console.log('[CandidateHeader] user changed:', user);
      this.currentUser = user;
      // Update isLoggedIn based on both user validity and service state
      const serviceLoggedIn = this.navigationService.isLoggedIn();
      const hasValidUser = this.isValidUser(user);
      this.isLoggedIn = serviceLoggedIn && hasValidUser;
      console.log('[CandidateHeader] Updated isLoggedIn to:', this.isLoggedIn, 'hasValidUser:', hasValidUser);
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
    this.router.navigate(['/candidate/about-us']);
    this.closeMobileMenu();
  }

  navigateToContact() {
    this.router.navigate(['/candidate/contact']);
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

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) {
      this.showNotificationMenu = false; // Đóng notification menu khi mở profile menu
    }
  }

  toggleNotificationMenu() {
    this.showNotificationMenu = !this.showNotificationMenu;
    if (this.showNotificationMenu) {
      this.showProfileMenu = false; // Đóng profile menu khi mở notification menu
    }
  }

  markAllAsRead() {
    // Logic đánh dấu tất cả thông báo đã đọc
    this.showNotificationMenu = false;
  }

  onProfileMouseLeave() {
    // Không dùng hover nữa, chỉ dùng click
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Đóng notification menu nếu click ngoài khu vực notification
    if (this.showNotificationMenu && this.notificationContainer && !this.notificationContainer.nativeElement.contains(target)) {
      this.showNotificationMenu = false;
    }
    
    // Đóng profile menu nếu click ngoài khu vực profile
    const profileContainer = target.closest('.profile-container');
    if (this.showProfileMenu && !profileContainer) {
      this.showProfileMenu = false;
    }
  }


  navigateToPersonalInfo() {
    this.router.navigate(['/candidate/profile']);
    this.showProfileMenu = false;
  }

  navigateToCvManagement() {
    this.router.navigate(['/candidate/cv-management']);
    this.showProfileMenu = false;
  }

  navigateToCareerInvitations() {
    this.router.navigate(['/candidate/career-opportunity-invitation']);
    this.showProfileMenu = false;
  }

  navigateToChangePassword() {
    this.router.navigate(['/candidate/change-password']);
    this.showProfileMenu = false;
  }

  navigateToSavedJobs() {
    this.router.navigate(['/candidate/save-jobs']);
    this.showProfileMenu = false;
  }

  navigateToAppliedJobs() {
    this.router.navigate(['/candidate/applied-jobs']);
    this.showProfileMenu = false;
  }

  navigateToJobSuggestionSettings() {
    this.router.navigate(['/candidate/job-suggestion-settings']);
    this.showProfileMenu = false;
  }

  navigateToService() {
    this.router.navigate(['/candidate/service']);
    this.showProfileMenu = false;
  }

  /**
   * Kiểm tra xem user có hợp lệ không
   * User hợp lệ phải có id (hoặc userId) - roles có thể rỗng nếu backend chưa trả về
   */
  private isValidUser(user: any): boolean {
    if (!user) {
      return false;
    }
    
    // User phải có id hoặc userId (một số API trả về userId thay vì id)
    const hasId = !!(user.id || user.userId);
    if (!hasId) {
      return false;
    }
    
    // Nếu có id/userId thì coi là user hợp lệ, roles có thể rỗng (backend có thể chưa trả về)
    // Chỉ cần kiểm tra roles là array (nếu có)
    if (user.roles && !Array.isArray(user.roles)) {
      return false;
    }
    
    return true;
  }
}