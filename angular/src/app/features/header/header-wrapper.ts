import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderTypeService, HeaderType } from '../../core/services/header-type.service';
import { NavigationService } from '../../core/services/navigation.service';
import { CandidateHeaderComponent } from './candidate-header/candidate-header';
import { RecruiterHeaderComponent } from './recruiter-header/recruiter-header';

@Component({
  selector: 'app-header-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    CandidateHeaderComponent,
    RecruiterHeaderComponent
  ],
  template: `
    <div class="header-container">
      <app-candidate-header *ngIf="currentHeaderType === 'candidate'" class="header-component"></app-candidate-header>
      <app-recruiter-header *ngIf="currentHeaderType === 'recruiter'" class="header-component"></app-recruiter-header>
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

  constructor(
    private headerTypeService: HeaderTypeService,
    private navigationService: NavigationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Set header type based on current URL and login state
    const currentUrl = this.router.url;
    const isLoggedIn = this.navigationService.isLoggedIn();
    const userRole = this.navigationService.getCurrentRole();
    
    if (currentUrl.startsWith('/recruiter') || userRole === 'recruiter') {
      this.headerTypeService.switchToRecruiter();
    } else {
      this.headerTypeService.switchToCandidate();
    }
    
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
}
