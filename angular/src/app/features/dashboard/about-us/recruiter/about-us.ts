import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss'
})
export class AboutUs implements OnInit, AfterViewInit, OnDestroy {
  imagePath: string = 'assets/images/about-us/introduction.png';
  private routerSubscription?: Subscription;

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/recruiter/service') {
          setTimeout(() => this.scrollToService(), 300);
        } else if (event.url === '/recruiter/about-us') {
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }
      });
  }

  ngAfterViewInit() {
    if (this.router.url === '/recruiter/service') {
      setTimeout(() => this.scrollToService(), 300);
    } else if (this.router.url === '/recruiter/about-us') {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  scrollToService(): void {
    const element = document.getElementById('service-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onPostJob(): void {
    if (!this.navigationService.isLoggedIn()) {
      this.router.navigate(['/recruiter/login']);
    } else {
      const isVerified = this.navigationService.isVerified();
      if (!isVerified) {
        this.router.navigate(['/recruiter/recruiter-verify']);
      }
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
