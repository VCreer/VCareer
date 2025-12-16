import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LogoSectionComponent } from '../../../shared/components/logo-section/logo-section';
import { ButtonComponent } from '../../../shared/components/button/button';
import { IconButtonBadgeComponent } from '../../../shared/components/icon-button-badge/icon-button-badge';
import { IconActionButtonComponent } from '../../../shared/components/icon-action-button/icon-action-button';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { NotificationMenuComponent, NotificationItem } from '../../../shared/components/notification-menu/notification-menu';

@Component({
  selector: 'app-recruiter-header-management',
  standalone: true,
  imports: [CommonModule, LogoSectionComponent, ButtonComponent, IconButtonBadgeComponent, IconActionButtonComponent, SidebarComponent, NotificationMenuComponent],
  templateUrl: './recruiter-header-management.html',
  styleUrls: ['./recruiter-header-management.scss']
})
export class RecruiterHeaderManagementComponent implements OnInit, OnDestroy {
  showDropdownMenu = false;
  showSidebar = false;
  cartCount = 0;
  showNotificationMenu = false;
  notificationCount = 0;
  notifications: NotificationItem[] = [];
  isLoggedIn = false;
  private cartSubscription?: Subscription;
  private loginSubscription?: Subscription;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    // Load initial cart count
    this.cartCount = this.cartService.getCartCount();

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.cartCount = this.cartService.getCartCount();
    });

    // Initialize login state
    this.isLoggedIn = this.navigationService.isLoggedIn();
    
    // Subscribe to login state changes
    this.loginSubscription = this.navigationService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.loadNotifications();
        this.loadUnreadCount();
      } else {
        this.notifications = [];
        this.notificationCount = 0;
      }
    });

    // Load notifications if already logged in
    if (this.isLoggedIn) {
      this.loadNotifications();
      this.loadUnreadCount();
    }
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.caret-menu-wrapper')) {
      this.showDropdownMenu = false;
    }
    // Close notification menu if click outside
    if (!target.closest('.notification-menu-wrapper')) {
      this.showNotificationMenu = false;
    }
    // Only close sidebar if it was manually opened (has .show class) and click is outside
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('show')) {
      if (!target.closest('.sidebar') && !target.closest('.hamburger-menu')) {
        this.showSidebar = false;
      }
    }
  }

  toggleDropdownMenu() {
    this.showDropdownMenu = !this.showDropdownMenu;
  }

  toggleSidebar() {
    // Always toggle based on current showSidebar state, not DOM state
    // This ensures consistent behavior
    this.showSidebar = !this.showSidebar;

    if (this.showSidebar) {
      this.showDropdownMenu = false;
    }
  }

  closeSidebar() {
    this.showSidebar = false;
  }

  logout() {
    this.navigationService.logout();
    this.router.navigate(['/recruiter/about-us']);
  }

  navigateToFindCv() {
    this.router.navigate(['/recruiter/find-cv']);
  }

  navigateToCart() {
    this.router.navigate(['/recruiter/cart']);
  }

  navigateToHome() {
    this.router.navigate(['/recruiter/home']);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToPostJob() {
    if (!this.navigationService.isLoggedIn()) {
      this.router.navigate(['/recruiter/login']);
    } else {
      this.router.navigate(['/recruiter/recruitment-report']);
    }
  }

  toggleNotificationMenu() {
    this.showNotificationMenu = !this.showNotificationMenu;
    if (this.showNotificationMenu) {
      this.loadNotifications();
    }
  }

  navigateToNotifications() {
    this.showNotificationMenu = false;
    this.router.navigate(['/recruiter/notifications']);
  }

  onMarkAllRead() {
    if (!this.isLoggedIn) return;
    
    this.notificationService.markAllAsRead('Recruiter')
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

  loadNotifications() {
    if (!this.isLoggedIn) {
      return;
    }
    
    this.notificationService.getNotifications('Recruiter', 0, 3)
      .pipe(
        catchError(error => {
          console.error('[Notification] Error loading notifications:', error);
          return of({ items: [], totalCount: 0, unreadCount: 0 });
        })
      )
      .subscribe({
        next: (result) => {
          // Sort by creationTime DESC (newest first)
          const sortedItems = (result.items || []).sort((a, b) => {
            const dateA = new Date(a.creationTime).getTime();
            const dateB = new Date(b.creationTime).getTime();
            return dateB - dateA; // DESC: newest first
          });
          
          // Convert NotificationDto to NotificationItem
          this.notifications = sortedItems.slice(0, 3).map(item => ({
            id: item.id,
            text: item.message || item.title,
            date: item.creationTime,
            isRead: item.isRead
          }));
        },
        error: (error) => {
          console.error('[Notification] Subscription error:', error);
        }
      });
  }

  loadUnreadCount() {
    if (!this.isLoggedIn) {
      return;
    }
    
    this.notificationService.getUnreadCount('Recruiter')
      .pipe(
        catchError(error => {
          console.error('[Notification] Error loading unread count:', error);
          return of(0);
        })
      )
      .subscribe({
        next: (count) => {
          this.notificationCount = count;
        },
        error: (error) => {
          console.error('[Notification] Unread count subscription error:', error);
        }
      });
  }
}

