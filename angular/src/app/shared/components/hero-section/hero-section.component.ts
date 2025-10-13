import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent {
  @Input() backgroundImage = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showSearchForm = true;
  @Output() searchJobs = new EventEmitter<any>();

  searchForm = {
    jobTitle: '',
    location: '',
    category: ''
  };

  onSearch() {
    this.searchJobs.emit(this.searchForm);
  }
}
