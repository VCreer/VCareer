import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOptionsService, FilterOption } from '../../../core/services/filter-options.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss']
})
export class FilterBarComponent implements OnInit {
  @Input() selectedFilter = 'Địa điểm';
  @Output() filterChange = new EventEmitter<string>();
  @Output() locationChange = new EventEmitter<string>();

  showFilterDropdown = false;
  selectedLocation = '';
  currentFilterOptions: FilterOption[] = [];
  displayedOptions: FilterOption[] = [];
  remainingOptions: FilterOption[] = [];
  currentIndex = 0;
  visibleCount = 7;
  isLoading = false;

  @ViewChild('tagsRef') tagsRef?: ElementRef<HTMLDivElement>;

  constructor(private filterOptionsService: FilterOptionsService, private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }

  ngOnInit() {
    this.loadFilterOptions();
  }

  loadFilterOptions() {
    this.isLoading = true;
    this.filterOptionsService.getFilterOptions(this.selectedFilter).subscribe({
      next: (options) => {
        this.currentFilterOptions = options;
        this.splitOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading filter options:', error);
        this.isLoading = false;
      }
    });
  }

  splitOptions() {
    // Tất cả filter đều phân trang theo nhóm 7
    this.displayedOptions = this.currentFilterOptions.slice(this.currentIndex, this.currentIndex + this.visibleCount);
    this.remainingOptions = this.currentFilterOptions.slice(this.currentIndex + this.visibleCount);
  }

  toggleFilterDropdown() {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  selectFilter(filter: string) {
    this.selectedFilter = filter;
    this.selectedLocation = '';
    this.currentIndex = 0;
    this.loadFilterOptions();
    this.filterChange.emit(filter);
  }

  selectLocation(location: string) {
    this.selectedLocation = location;
    this.locationChange.emit(location);
  }

  scrollLeft() {
    if (this.currentIndex > 0) {
      const step = this.visibleCount;
      this.currentIndex = Math.max(0, this.currentIndex - step);
      this.splitOptions();
    }
  }

  scrollRight() {
    if (this.currentIndex < this.currentFilterOptions.length - this.visibleCount) {
      const step = this.visibleCount;
      const maxStart = Math.max(0, this.currentFilterOptions.length - this.visibleCount);
      this.currentIndex = Math.min(maxStart, this.currentIndex + step);
      this.splitOptions();
    }
  }
}
