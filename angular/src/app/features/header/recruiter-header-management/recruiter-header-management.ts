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
import { LanguageToggleComponent } from '../../../shared/components/language-toggle/language-toggle';
import { NotificationMenuComponent, NotificationItem } from '../../../shared/components/notification-menu/notification-menu';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-recruiter-header-management',
  standalone: true,
  imports: [CommonModule, LogoSectionComponent, ButtonComponent, IconButtonBadgeComponent, IconActionButtonComponent, LanguageToggleComponent, NotificationMenuComponent, SidebarComponent],
  templateUrl: './recruiter-header-management.html',
  styleUrls: ['./recruiter-header-management.scss']
})
export class RecruiterHeaderManagementComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  showDropdownMenu = false;
  showNotificationMenu = false;
  showSidebar = false;
  cartCount = 0;
  private cartSubscription?: Subscription;
  
  notifications: NotificationItem[] = [
    { id: '1', text: 'Bạn có tin tuyển dụng mới phù hợp', date: '15/10/2025', isRead: false },
    { id: '2', text: 'Ứng viên đã nộp hồ sơ cho vị trí của bạn', date: '14/10/2025', isRead: false },
    { id: '3', text: 'Tin tuyển dụng của bạn đã được duyệt', date: '13/10/2025', isRead: true },
    { id: '4', text: 'Nhắc nhở: Tin tuyển dụng sắp hết hạn', date: '12/10/2025', isRead: false }
  ];

  get notificationCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private cartService: CartService
  ) {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  ngOnInit() {
    // Load initial cart count
    this.cartCount = this.cartService.getCartCount();
    
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.cartCount = this.cartService.getCartCount();
    });
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
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
    if (!target.closest('.sidebar') && !target.closest('.hamburger-menu')) {
      this.showSidebar = false;
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
    }
  }

  toggleSidebar() {
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
    this.notifications.forEach(n => n.isRead = true);
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
}

