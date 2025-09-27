import { Component, inject, OnInit } from '@angular/core';
import { LocalizationPipe } from '@abp/ng.core';
import { Router } from '@angular/router';
import { CustomAuthService } from '../services/custom-auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [LocalizationPipe, CommonModule]
})
export class HomeComponent implements OnInit {
  private customAuthService = inject(CustomAuthService);
  private router = inject(Router);

  showLoginSuccessMessage = false;

  ngOnInit() {
    // Check if user just logged in (you can use a service or localStorage to track this)
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      this.showLoginSuccessMessage = true;
      localStorage.removeItem('justLoggedIn');
      // Hide message after 3 seconds
      setTimeout(() => {
        this.showLoginSuccessMessage = false;
      }, 3000);
    }
  }

  get hasLoggedIn(): boolean {
    return this.customAuthService.isAuthenticated
  }

  login() {
    this.customAuthService.navigateToLogin();
  }
}
