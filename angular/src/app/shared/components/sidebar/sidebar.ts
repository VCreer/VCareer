import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TeamManagementService } from '../../../proxy/services/team-management';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() showChange = new EventEmitter<boolean>();
  
  // Mock user data - can be replaced with actual user service later
  userName: string = 'Uông Hoàng Duy';
  userRole: string = 'Employer';
  verificationLevel: string = 'Cấp 1/3';
  currentRoute: string = '';
  isVerified: boolean = false;
  isHRStaff: boolean = false; // Flag để kiểm tra xem có phải HR Staff (IsLead = false) không
  isEmployeeRoute: boolean = false; // Flag để kiểm tra xem có phải employee route không
  private routerSubscription?: Subscription;
  private verificationSubscription?: Subscription;

  constructor(
    private translationService: TranslationService,
    private router: Router,
    private navigationService: NavigationService,
    private teamManagementService: TeamManagementService
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
    
    // Check if user is HR Staff (IsLead = false)
    this.checkUserRole();
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
    this.updateRouteType(this.currentRoute);
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.updateRouteType(this.currentRoute);
      });
  }

  private updateRouteType(url: string): void {
    this.isEmployeeRoute = url.startsWith('/employee');
    // Update user role and name based on route
    if (this.isEmployeeRoute) {
      this.userRole = 'Employee';
      this.userName = 'Employee User';
    } else {
      this.userRole = 'Employer';
      this.userName = 'Uông Hoàng Duy';
    }
  }

  checkEmployeeRoute(): void {
    // Kiểm tra xem route hiện tại có phải employee route không
    this.isEmployeeRoute = this.currentRoute.startsWith('/employee');
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

  // Track if sidebar was manually opened (not by hover)
  private manuallyOpened = false;
  private isHovering = false;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    // Only auto-open on hover if not manually opened
    if (!this.manuallyOpened) {
      this.isHovering = true;
      // Don't change show state, let CSS handle the visual expansion
      // CSS :hover will handle the visual expansion
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    // Only auto-close if sidebar was opened by hover (not manually)
    if (!this.manuallyOpened && this.isHovering) {
      this.isHovering = false;
      // CSS :hover will handle the visual collapse
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']) {
      const newValue = changes['show'].currentValue;
      // If show is set to true from parent (manual toggle), mark as manually opened
      if (newValue) {
        // This is a manual toggle from parent (hamburger menu)
        this.manuallyOpened = true;
        this.isHovering = false; // Reset hover state when manually opened
      } else {
        // If show is set to false from parent, reset manuallyOpened
        this.manuallyOpened = false;
        this.isHovering = false;
      }
    }
  }

  onClose(): void {
    this.manuallyOpened = false;
    this.close.emit();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  logout(): void {
    this.navigationService.logout();
    if (this.isEmployeeRoute) {
      this.router.navigate(['/employee/login']);
    } else {
      this.router.navigate(['/recruiter/about-us']);
    }
    this.onClose();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.onClose();
  }

  isActive(path: string): boolean {
    return this.currentRoute === path || this.currentRoute.startsWith(path + '/');
  }

  checkUserRole(): void {
    // Kiểm tra xem user có phải HR Staff không (IsLead = false)
    this.teamManagementService.getCurrentUserInfo().subscribe({
      next: (userInfo) => {
        // HR Staff là user có IsLead = false
        this.isHRStaff = !userInfo.isLead;
      },
      error: (error) => {
        // Nếu không lấy được thông tin, mặc định là Leader (không ẩn menu)
        console.error('Error loading user info in sidebar:', error);
        this.isHRStaff = false;
      }
    });
  }
}

