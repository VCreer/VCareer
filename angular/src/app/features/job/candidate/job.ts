import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { JobFilterComponent } from '../../../shared/components/job-filter/job-filter';
import { JobListComponent } from '../../../shared/components/job-list/job-list';

@Component({
  selector: 'app-job',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JobFilterComponent,
    JobListComponent
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
    this.selectedCategory = event.target.value;
  }

  onLocationChange(event: any): void {
    this.selectedLocation = event.target.value;
  }

  onPositionChange(event: any): void {
    this.searchPosition = event.target.value;
  }

}
