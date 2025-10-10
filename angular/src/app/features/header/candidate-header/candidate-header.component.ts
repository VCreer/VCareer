import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-candidate-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-header.component.html',
  styleUrls: ['./candidate-header.component.scss']
})
export class CandidateHeaderComponent implements OnInit {
  currentRoute = '';
  isMenuOpen = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  navigateToJobs() {
    this.router.navigate(['/candidate/jobs']);
    this.closeMobileMenu();
  }

  navigateToCompanies() {
    this.router.navigate(['/candidate/companies']);
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

  navigateToRegister() {
    this.router.navigate(['/candidate/register']);
    this.closeMobileMenu();
  }

  navigateToRecruiter() {
    this.router.navigate(['/recruiter/login']);
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
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }
}
