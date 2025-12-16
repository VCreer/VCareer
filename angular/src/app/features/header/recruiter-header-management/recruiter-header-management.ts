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
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-recruiter-header-management',
  standalone: true,
  imports: [CommonModule, LogoSectionComponent, ButtonComponent, IconButtonBadgeComponent, IconActionButtonComponent, SidebarComponent],
  templateUrl: './recruiter-header-management.html',
  styleUrls: ['./recruiter-header-management.scss']
})
export class RecruiterHeaderManagementComponent implements OnInit, OnDestroy {
  showDropdownMenu = false;
  showSidebar = false;
  cartCount = 0;
  private cartSubscription?: Subscription;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private cartService: CartService
  ) { }

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.caret-menu-wrapper')) {
      this.showDropdownMenu = false;
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
}

