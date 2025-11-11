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
        // Keep sidebar state on route change (don't auto-close)
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
        this.sidebarExpanded = isExpanded;
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
  }
}

