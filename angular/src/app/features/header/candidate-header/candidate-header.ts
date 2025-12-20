import { Component, OnInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { HeaderTypeService } from '../../../core/services/header-type.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthStateService } from '../../../core/services/auth-Cookiebased/auth-state.service';
import type { ProfileDto } from '../../../proxy/dto/profile/models';
import { NotificationService, NotificationDto } from '../../../core/services/notification.service';
import { catchError, of, Subscription } from 'rxjs';

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
  profileData: ProfileDto | null = null;
  selectedLanguage: string = '';
  notifications: NotificationDto[] = [];
  unreadCount: number = 0;
  isLoadingNotifications = false;
  expandedSections = {
    jobManagement: true,
    cvManagement: true,
    personalSecurity: false
  };
  private unreadCountSubscription?: Subscription;

  constructor(
    private router: Router,
    private headerTypeService: HeaderTypeService,
    private navigationService: NavigationService,
    private translationService: TranslationService,
    private authStateService: AuthStateService,
    private http: HttpClient,
    private notificationService: NotificationService
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
    
    // Subscribe to authentication state changes
    this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      // Only update if we also have a valid user, otherwise force to false
      const currentUser = this.authStateService.user;
      const hasValidUser = this.isValidUser(currentUser);
      this.isLoggedIn = isLoggedIn && hasValidUser;
    });

    // Subscribe to current user changes
    this.authStateService.user$.subscribe(user => {
      this.currentUser = user;
      // Update isLoggedIn based on both user validity and service state
      const serviceLoggedIn = this.navigationService.isLoggedIn();
      const hasValidUser = this.isValidUser(user);
      this.isLoggedIn = serviceLoggedIn && hasValidUser;
      
      if (this.isLoggedIn && hasValidUser) {
        this.loadProfileData();
        this.loadNotifications();
        this.loadUnreadCount();
      } else {
        this.profileData = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.isLoadingNotifications = false;
      }
    });
    
    // Load profile data + notifications on init nếu đã đăng nhập
    if (this.isLoggedIn && this.isValidUser(this.currentUser)) {
      this.loadProfileData();
      this.loadNotifications();
      this.loadUnreadCount();
    }

    // Subscribe to unread count changes from service
    this.unreadCountSubscription = this.notificationService.unreadCount$.subscribe(counts => {
      if (counts['Candidate'] !== undefined) {
        this.unreadCount = counts['Candidate'];
      }
    });
  }
  
  loadProfileData() {
    const apiUrl = `${environment.apis.default.url}/api/profile`;
    this.http.get<ProfileDto>(apiUrl, {
      withCredentials: true,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).subscribe({
      next: (response) => {
        this.profileData = response;
      },
      error: (error) => {
        console.error('Error loading profile data:', error);
        this.profileData = null;
      }
    });
  }
  
  getFullName(): string {
    if (this.profileData) {
      const name = this.profileData.name || '';
      const surname = this.profileData.surname || '';
      const fullName = `${name} ${surname}`.trim();
      if (fullName) return fullName;
    }
    if (this.currentUser?.fullName) {
      return this.currentUser.fullName;
    }
    if (this.currentUser?.name) {
      return this.currentUser.name;
    }
    if (this.currentUser?.userName) {
      return this.currentUser.userName;
    }
    return 'Người dùng';
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  navigateToJobs() {
    this.router.navigate(['/job']);
    this.closeMobileMenu();
  }

  navigateToCompanies() {
    this.router.navigate(['/company']);
    this.closeMobileMenu();
  }

  navigateToAbout() {
    this.router.navigate(['/about-us']);
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
      this.loadNotifications(); // Reload notifications when opening menu
    }
  }

  loadNotifications() {
    if (!this.isLoggedIn) {
      return;
    }
    
    this.isLoadingNotifications = true;
    // Load only 3 notifications for popup, sorted by creationTime DESC (newest first)
    this.notificationService.getNotifications('Candidate', 0, 3)
      .pipe(
        catchError(error => {
          console.error('[Notification] Error loading notifications:', error);
          return of({ items: [], totalCount: 0, unreadCount: 0 });
        })
      )
      .subscribe({
        next: (result) => {
          
          // Sort by creationTime DESC (newest first) to ensure newest notifications appear at top
          const sortedItems = (result.items || []).sort((a, b) => {
            const dateA = new Date(a.creationTime).getTime();
            const dateB = new Date(b.creationTime).getTime();
            return dateB - dateA; // DESC: newest first
          });
          
          // Take only first 3 items
          this.notifications = sortedItems.slice(0, 3);
          this.unreadCount = result.unreadCount || 0;
          this.isLoadingNotifications = false;
        },
        error: (error) => {
          console.error('[Notification] Subscription error:', error);
          this.isLoadingNotifications = false;
        }
      });
  }

  loadUnreadCount() {
    if (!this.isLoggedIn) {
      return;
    }
    
    this.notificationService.getUnreadCount('Candidate')
      .pipe(
        catchError(error => {
          console.error('[Notification] Error loading unread count:', error);
          return of(0);
        })
      )
      .subscribe({
        next: (count) => {
          this.unreadCount = count;
        },
        error: (error) => {
          console.error('[Notification] Unread count subscription error:', error);
        }
      });
  }

  markAllAsRead() {
    if (!this.isLoggedIn) return;
    
    this.notificationService.markAllAsRead('Candidate')
      .pipe(
        catchError(error => {
          console.error('Error marking all as read:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      });
  }

  markAsRead(notification: NotificationDto) {
    if (notification.isRead) return;
    
    this.notificationService.markAsRead(notification.id)
      .pipe(
        catchError(error => {
          console.error('Error marking notification as read:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        notification.isRead = true;
        this.loadUnreadCount();
      });
  }

  navigateToJobDetail(notification: NotificationDto) {
    if (notification.relatedEntityType === 'JobPost' && notification.relatedEntityId) {
      this.markAsRead(notification);
      this.showNotificationMenu = false;
      this.router.navigate(['/candidate/job-detail', notification.relatedEntityId]);
    }
  }

  navigateToAllNotifications() {
    this.showNotificationMenu = false;
    this.router.navigate(['/candidate/notifications']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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







