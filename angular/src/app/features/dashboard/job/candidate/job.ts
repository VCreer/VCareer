import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { JobFilterComponent } from '../../../../shared/components/job-filter/job-filter';
import { JobListComponent } from '../../../../shared/components/job-list/job-list';
import { JobListDetailComponent } from '../../../../shared/components/job-list-detail/job-list-detail';
import { SearchHeaderComponent } from '../../../../shared/components/search-header/search-header';

@Component({
  selector: 'app-job',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JobFilterComponent,
    JobListComponent,
    JobListDetailComponent,
    SearchHeaderComponent
  ],
  templateUrl: './job.html',
  styleUrls: ['./job.scss']
})
export class JobComponent implements OnInit {
  @ViewChild(JobListComponent) jobListComponent!: JobListComponent;
  @ViewChild(JobFilterComponent) jobFilterComponent!: JobFilterComponent;
  
  selectedLanguage: string = 'vi';
  searchPosition: string = '';
  selectedCategory: string = '';
  selectedLocation: string = '';
  currentFilters: any = {};
  selectedJob: any = null;

  constructor(
    private router: Router,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onSearchJobs(searchParams: any) {
    console.log('Search jobs with params:', searchParams);
    // Trigger search in job-list component
    if (this.jobListComponent) {
      this.jobListComponent.applySearch(searchParams);
    }
  }

  onFilterChange(filterParams: any) {
    // Reset selected job when changing filters to return to initial state
    this.selectedJob = null;
    
    this.currentFilters = filterParams;
    console.log('Filter changed:', filterParams);
    
    // Combine search params with filter params
    const combinedParams = {
      position: this.searchPosition,
      category: this.selectedCategory,
      location: this.selectedLocation,
      ...this.currentFilters
    };
    
    // Trigger search in job-list component
    if (this.jobListComponent) {
      this.jobListComponent.applySearch(combinedParams);
    }
  }

  onClearFilters() {
    this.currentFilters = {};
    this.searchPosition = '';
    this.selectedCategory = '';
    this.selectedLocation = '';
    console.log('Clear filters clicked');
    
    // Clear filters in job-filter component
    if (this.jobFilterComponent) {
      this.jobFilterComponent.clearFilters();
    }
    
    // Reset search in job-list component
    if (this.jobListComponent) {
      this.jobListComponent.clearFilters();
    }
  }

  onSearch(): void {
    // Reset selected job when searching to return to initial state
    this.selectedJob = null;
    
    const searchParams = {
      position: this.searchPosition,
      category: this.selectedCategory,
      location: this.selectedLocation,
      ...this.currentFilters
    };
    console.log('Search with params:', searchParams);
    
    // Trigger search in job-list component
    if (this.jobListComponent) {
      this.jobListComponent.applySearch(searchParams);
    }
  }

  onCategoryChange(event: any): void {
    // Reset selected job when changing category to return to initial state
    this.selectedJob = null;
    this.selectedCategory = event.target.value;
  }

  onLocationChange(event: any): void {
    // Reset selected job when changing location to return to initial state
    this.selectedJob = null;
    this.selectedLocation = event.target.value;
  }

  onPositionChange(event: any): void {
    this.searchPosition = event.target.value;
  }

  onClearPosition(): void {
    // Reset selected job when clearing position to return to initial state
    this.selectedJob = null;
    this.searchPosition = '';
    
    // Trigger search to reload job list
    const searchParams = {
      position: '',
      category: this.selectedCategory,
      location: this.selectedLocation,
      ...this.currentFilters
    };
    
    if (this.jobListComponent) {
      this.jobListComponent.applySearch(searchParams);
    }
  }

  onQuickView(job: any) {
    this.selectedJob = job;
  }

  onCloseDetail() {
    this.selectedJob = null;
  }

  onViewDetail(job: any) {
    console.log('View detail:', job);
    // Navigate to full job detail page
    this.router.navigate(['/candidate/job-detail']);
  }

  onApply(job: any) {
    console.log('Apply to job:', job);
    // Handle apply logic
  }

  onJobClick(job: any) {
    // Navigate to job detail page when clicking on job card
    this.router.navigate(['/candidate/job-detail']);
  }

  onJobHidden() {
    this.selectedJob = null;
  }
}
