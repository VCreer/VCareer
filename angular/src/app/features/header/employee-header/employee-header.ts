import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoSectionComponent } from '../../../shared/components/logo-section/logo-section';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-employee-header',
  standalone: true,
  imports: [CommonModule, LogoSectionComponent],
  templateUrl: './employee-header.html',
  styleUrls: ['./employee-header.scss']
})
export class EmployeeHeaderComponent implements OnInit {
  showSidebar = false;
  showDropdownMenu = false;

  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.caret-menu-wrapper')) {
      this.showDropdownMenu = false;
    }
    if (!target.closest('.sidebar') && !target.closest('.hamburger-menu')) {
      // Don't auto-close sidebar on employee layout (it's always visible)
    }
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('show');
      this.showSidebar = sidebar.classList.contains('show');
    }
  }

  toggleDropdownMenu() {
    this.showDropdownMenu = !this.showDropdownMenu;
  }

  logout() {
    this.navigationService.logout();
    this.router.navigate(['/employee/login']);
  }

  navigateToHome() {
    this.router.navigate(['/employee/home']);
  }
}

