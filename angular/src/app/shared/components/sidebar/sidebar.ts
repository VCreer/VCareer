import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { TeamManagementService } from '../../../proxy/services/team-management';
import { AuthStateService } from '../../../core/services/auth-Cookiebased/auth-state.service';
import { AuthFacadeService } from '../../../core/services/auth-Cookiebased/auth-facade.service';

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
  
  // User data - loaded from API
  userName: string = 'Người dùng';
  userRole: string = 'Leader Recruiter';
  verificationLevel: string = 'Cấp 1/3';
  currentRoute: string = '';
  isVerified: boolean = false;
  isEmployeeRoute: boolean = false;
  private routerSubscription?: Subscription;
  private verificationSubscription?: Subscription;
    isHRStaff: boolean = false; // Flag để kiểm tra xem có phải HR Staff (IsLead = false) không
     showUserManagementDropdown: boolean = false;
  private userSubscription?: Subscription;


  constructor(
    private translationService: TranslationService,
    private router: Router,
    private navigationService: NavigationService,
    private teamManagementService: TeamManagementService,
    private authStateService: AuthStateService,
    private authFacadeService: AuthFacadeService
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
    // this.checkUserRole();
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
    this.updateRouteType(this.currentRoute);
    
    // Subscribe to user changes to update name
    this.userSubscription = this.authStateService.user$.subscribe(user => {
      if (user && user.fullName) {
        this.userName = user.fullName;
      } else if (user && user.email) {
        this.userName = user.email.split('@')[0];
      }
    });
    
    // Load user info if not already loaded
    if (!this.authStateService.user) {
      this.loadUserInfo();
    } else {
      // Use existing user info
      const user = this.authStateService.user;
      this.userName = user?.fullName || user?.email?.split('@')[0] || 'Người dùng';
    }
    
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.updateRouteType(this.currentRoute);
        // Reload user info when route changes (in case user switched accounts)
        this.loadUserInfo();
      });
  }

  private updateRouteType(url: string): void {
    this.isEmployeeRoute = url.startsWith('/employee');
    // Update user role based on route
    if (this.isEmployeeRoute) {
      this.userRole = 'Employee';
    } else {
      // For recruiter, role will be set based on isLead from API
      // Default to 'Leader Recruiter' until we load user info
      this.userRole = 'Leader Recruiter';
    }
    // User name will be loaded from API, don't override it here
  }

  private loadUserInfo(): void {
    // First try to get from AuthStateService (already loaded)
    const currentUser = this.authStateService.user;
    if (currentUser && currentUser.fullName) {
      this.userName = currentUser.fullName;
      return;
    }

    // If not available, load from API
    if (this.isEmployeeRoute) {
      // For employee, use basic user info
      this.authFacadeService.loadCurrentUser().subscribe({
        next: (user) => {
          this.userName = user?.fullName || user?.email?.split('@')[0] || 'Người dùng';
        },
        error: (error) => {
          console.error('Error loading user info:', error);
          this.userName = 'Người dùng';
        }
      });
    } else {
      // For recruiter, try to get from TeamManagementService first (has more info)
      this.teamManagementService.getCurrentUserInfo().subscribe({
        next: (userInfo) => {
          if (userInfo.fullName) {
            this.userName = userInfo.fullName;
          } else {
            // Fallback to AuthStateService
            const user = this.authStateService.user;
            this.userName = user?.fullName || user?.email?.split('@')[0] || 'Người dùng';
          }
          // Update role based on isLead
          if (userInfo.isLead) {
            this.userRole = 'Leader Recruiter';
          } else {
            this.userRole = 'HR Staff';
          }
        },
        error: (error) => {
          console.error('Error loading user info from TeamManagementService:', error);
          // Fallback to AuthStateService
          this.authFacadeService.loadCurrentUser().subscribe({
            next: (user) => {
              this.userName = user?.fullName || user?.email?.split('@')[0] || 'Người dùng';
            },
            error: (loadError) => {
              console.error('Error loading user info from AuthFacadeService:', loadError);
              this.userName = 'Người dùng';
            }
          });
        }
      });
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
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
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

  toggleUserManagementDropdown(event: Event): void {
    event.stopPropagation();
    this.showUserManagementDropdown = !this.showUserManagementDropdown;
  }

  navigateToUserManagement(path: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showUserManagementDropdown = false;
    this.navigateTo(path);
  }

  isUserManagementActive(): boolean {
    return this.currentRoute.startsWith('/employee/user-management');
  }

  checkUserRole(): void {
    // Kiểm tra xem route hiện tại có phải employee route không
    const currentUrl = this.router.url;
    const isEmployeeRoute = currentUrl.startsWith('/employee');
    
    // Nếu là employee route, không gọi API getCurrentUserInfo (chỉ dành cho Recruiter)
    if (isEmployeeRoute) {
      this.isEmployeeRoute = true;
      this.userRole = 'Employee';
      this.isHRStaff = false;
      return;
    }
    
    // Chỉ gọi API cho recruiter routes
    // Kiểm tra xem user có phải HR Staff không (IsLead = false)
    this.teamManagementService.getCurrentUserInfo().subscribe({
      next: (userInfo) => {
        // HR Staff là user có IsLead = false
        this.isHRStaff = !userInfo.isLead;
        // Update role based on isLead
        if (userInfo.isLead) {
          this.userRole = 'Leader Recruiter';
        } else {
          this.userRole = 'HR Staff';
        }
      },
      error: (error) => {
        // Nếu không lấy được thông tin, mặc định là Leader (không ẩn menu)
        console.error('Error loading user info in sidebar:', error);
        this.isHRStaff = false;
        // Keep default role as 'Leader Recruiter'
      }
    });
  }
}

