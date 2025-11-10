import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  
  // Mock user data - can be replaced with actual user service later
  userName: string = 'Uông Hoàng Duy';
  userRole: string = 'Employer';
  verificationLevel: string = 'Cấp 1/3';
  currentRoute: string = '';
  isVerified: boolean = false;
  private routerSubscription?: Subscription;
  private verificationSubscription?: Subscription;

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private navigationService: NavigationService
  ) {
    // Subscribe to verification status
    this.isVerified = this.navigationService.isVerified();
    this.verificationSubscription = this.navigationService.isVerified$.subscribe(verified => {
      this.isVerified = verified;
      // Update verification level display based on status
      if (!verified) {
        this.verificationLevel = 'Chưa xác thực';
      } else {
        this.verificationLevel = 'Cấp 1/3';
      }
    });
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.verificationSubscription) {
      this.verificationSubscription.unsubscribe();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.show) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  logout(): void {
    this.navigationService.logout();
    this.router.navigate(['/recruiter/about-us']);
    this.onClose();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.onClose();
  }

  isActive(path: string): boolean {
    return this.currentRoute === path || this.currentRoute.startsWith(path + '/');
  }
}

