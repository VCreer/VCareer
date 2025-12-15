import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { CartService } from '../../../core/services/cart.service';
import { LogoSectionComponent } from '../../../shared/components/logo-section/logo-section';
import { ButtonComponent } from '../../../shared/components/button/button';
import { IconButtonBadgeComponent } from '../../../shared/components/icon-button-badge/icon-button-badge';
import { IconActionButtonComponent } from '../../../shared/components/icon-action-button/icon-action-button';
import { NotificationMenuComponent, NotificationItem } from '../../../shared/components/notification-menu/notification-menu';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { NotificationService, NotificationDto } from '../../../core/services/notification.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-recruiter-header-management',
  standalone: true,
  imports: [CommonModule, LogoSectionComponent, ButtonComponent, IconButtonBadgeComponent, IconActionButtonComponent, NotificationMenuComponent, SidebarComponent],
  templateUrl: './recruiter-header-management.html',
  styleUrls: ['./recruiter-header-management.scss']
})
export class RecruiterHeaderManagementComponent implements OnInit, OnDestroy {
  showDropdownMenu = false;
  showNotificationMenu = false;
  showSidebar = false;
  cartCount = 0;
  private cartSubscription?: Subscription;
  
  notifications: NotificationItem[] = [];
  notificationCount = 0;
  isLoadingNotifications = false;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Load initial cart count
    this.cartCount = this.cartService.getCartCount();
    
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.cartCount = this.cartService.getCartCount();
    });

    // Load notifications for recruiter
    this.loadNotifications();
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.caret-menu-wrapper')) {
      this.showDropdownMenu = false;
    }
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

  toggleNotificationMenu() {
    this.showNotificationMenu = !this.showNotificationMenu;
    if (this.showNotificationMenu) {
      this.showDropdownMenu = false;
      this.showSidebar = false;
      this.loadNotifications();
    }
  }

  toggleSidebar() {
    // Always toggle based on current showSidebar state, not DOM state
    // This ensures consistent behavior
    this.showSidebar = !this.showSidebar;
    
    if (this.showSidebar) {
      this.showDropdownMenu = false;
      this.showNotificationMenu = false;
    }
  }

  closeSidebar() {
    this.showSidebar = false;
  }

  onMarkAllRead() {
    this.notificationService.markAllAsRead('Recruiter')
      .pipe(
        catchError(error => {
          console.error('[Recruiter Header] Error mark all as read:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.loadNotifications();
      });
  }

  logout() {
    this.navigationService.logout();
    this.router.navigate(['/recruiter/about-us']);
  }

  navigateToPostJob() {
    this.router.navigate(['/recruiter/job-posting']);
  }

  navigateToFindCv() {
    this.router.navigate(['/recruiter/find-cv']);
  }

  navigateToCart() {
    this.router.navigate(['/recruiter/cart']);
  }

  navigateToNotifications() {
    this.router.navigate(['/recruiter/notifications']);
  }

  navigateToHome() {
    this.router.navigate(['/recruiter/home']);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  private loadNotifications() {
    this.isLoadingNotifications = true;
    this.notificationService.getNotifications('Recruiter', 0, 5)
      .pipe(
        catchError(error => {
          console.error('[Recruiter Header] Error loading notifications:', error);
          this.isLoadingNotifications = false;
          return of({ items: [], unreadCount: 0 });
        })
      )
      .subscribe((result: { items: NotificationDto[]; unreadCount: number }) => {
        this.notifications = (result.items || []).map(n => ({
          id: n.id,
          text: n.message || n.title,
          date: this.formatDate(n.creationTime),
          isRead: n.isRead
        }));
        this.notificationCount = result.unreadCount || 0;
        this.isLoadingNotifications = false;
      });
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

