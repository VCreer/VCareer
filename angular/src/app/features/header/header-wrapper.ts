import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HeaderTypeService, HeaderType } from '../../core/services/header-type.service';
import { NavigationService } from '../../core/services/navigation.service';
import { CandidateHeaderComponent } from './candidate-header/candidate-header';
import { RecruiterHeaderComponent } from './recruiter-header/recruiter-header';
import { RecruiterHeaderManagementComponent } from './recruiter-header-management/recruiter-header-management';

@Component({
  selector: 'app-header-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    CandidateHeaderComponent,
    RecruiterHeaderComponent,
    RecruiterHeaderManagementComponent
  ],
  template: `
    <div class="header-container">
      <app-candidate-header *ngIf="currentHeaderType === 'candidate'" class="header-component"></app-candidate-header>
      <app-recruiter-header *ngIf="currentHeaderType === 'recruiter' && !isManagementHeader" class="header-component"></app-recruiter-header>
      <app-recruiter-header-management *ngIf="currentHeaderType === 'recruiter' && isManagementHeader" class="header-component"></app-recruiter-header-management>
    </div>
  `,
  styles: [`
    .header-container {
      position: relative;
      width: 100%;
    }
    
    .header-component {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      width: 100%;
      transition: opacity 0.2s ease;
    }
    
    .header-component.ng-enter {
      opacity: 0;
    }
    
    .header-component.ng-enter-active {
      opacity: 1;
    }
  `]
})
export class HeaderWrapperComponent implements OnInit {
  currentHeaderType: HeaderType | null = 'candidate';
  isTransitioning = false;
  isManagementHeader = false;
  private lastPathname = '';

  constructor(
    private headerTypeService: HeaderTypeService,
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Set header type based on current URL and login state
    const currentUrl = this.router.url;
    this.updateHeaderType(currentUrl);
    
    // Subscribe to route changes - ignore query param changes for same route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentPathname = event.url.split('?')[0];
        // Only update if pathname actually changed (not just query params)
        if (currentPathname !== this.lastPathname) {
          this.lastPathname = currentPathname;
          this.updateHeaderType(event.url);
        }
      });
    
    // Subscribe to login state changes with debounce
    this.navigationService.isLoggedIn$.pipe(
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(() => {
      this.updateHeaderType(this.router.url);
    });
    
    // Subscribe to role changes with debounce
    this.navigationService.userRole$.pipe(
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(() => {
      this.updateHeaderType(this.router.url);
    });
    
    this.headerTypeService.headerType$.subscribe(headerType => {
      // Đảm bảo chỉ có một header hiển thị tại một thời điểm
      this.isTransitioning = true;
      this.currentHeaderType = null; // Ẩn tất cả header trước
      
      setTimeout(() => {
        this.currentHeaderType = headerType;
        this.isTransitioning = false;
      }, 100); // Tăng delay để đảm bảo chuyển đổi mượt mà
    });
  }

  private updateHeaderType(currentUrl: string) {
    const isLoggedIn = this.navigationService.isLoggedIn();
    const userRole = this.navigationService.getCurrentRole();
    
    // Extract pathname without query params
    const urlPath = currentUrl.split('?')[0];
    
    // Check if we should show management header for recruiter management routes
    const managementRoutes = [
      '/recruiter/home',
      '/recruiter/recruiter-verify',
      '/recruiter/recruiter-setting',
      '/recruiter/cv-management',
      '/recruiter/buy-services'
    ];
    
    const isManagementRoute = managementRoutes.some(route => 
      urlPath === route || urlPath.startsWith(route + '/')
    );
    
    // Only show management header if: logged in + recruiter role + management route
    if (isManagementRoute && isLoggedIn && userRole === 'recruiter') {
      this.isManagementHeader = true;
      this.headerTypeService.switchToRecruiter();
    } else if (urlPath.startsWith('/recruiter')) {
      // Recruiter routes but not logged in or not management route
      this.isManagementHeader = false;
      this.headerTypeService.switchToRecruiter();
    } else {
      // Default to candidate header
      this.isManagementHeader = false;
      this.headerTypeService.switchToCandidate();
    }
  }
}
