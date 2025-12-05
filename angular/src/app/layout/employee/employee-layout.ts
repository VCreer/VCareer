import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderWrapperComponent } from '../../features/header/header-wrapper';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderWrapperComponent, SidebarComponent],
  templateUrl: './employee-layout.html',
  styleUrls: ['./employee-layout.scss']
})
export class EmployeeLayoutComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    this.checkSidebarState();
    // Check sidebar state periodically (for hamburger menu toggle from header)
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Auto-close sidebar after navigation
        // Always close sidebar after navigation, regardless of how it was opened
        setTimeout(() => {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar && sidebar.classList.contains('show')) {
            this.onSidebarClose();
          }
        }, 50);
      });
  }

  ngOnDestroy() {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const isExpanded = sidebar.classList.contains('show');
      if (isExpanded !== this.sidebarExpanded) {
        // If sidebar was just closed, close all dropdowns
        if (this.sidebarExpanded && !isExpanded) {
          this.closeAllDropdowns();
        }
        this.sidebarExpanded = isExpanded;
      }
    }
  }

  private closeAllDropdowns(): void {
    // Remove dropdown-open class from all dropdown items
    const dropdownItems = document.querySelectorAll('.sidebar-nav-item-dropdown.dropdown-open');
    dropdownItems.forEach(item => {
      item.classList.remove('dropdown-open');
    });
    // Remove show class from all submenus
    const submenus = document.querySelectorAll('.sidebar-submenu.show');
    submenus.forEach(submenu => {
      submenu.classList.remove('show');
    });
  }

  // Method to handle sidebar toggle from hamburger menu
  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      if (this.sidebarExpanded) {
        sidebar.classList.add('show');
      } else {
        sidebar.classList.remove('show');
      }
    }
  }

  onSidebarClose(): void {
    // Close sidebar by removing 'show' class
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('show');
      this.sidebarExpanded = false;
    }
    // Close all dropdowns when sidebar closes
    this.closeAllDropdowns();
  }
}

