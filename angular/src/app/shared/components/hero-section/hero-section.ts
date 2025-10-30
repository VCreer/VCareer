import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-section.html',
  styleUrls: ['./hero-section.scss']
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

  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}
