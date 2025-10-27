import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { FilterBarComponent } from '../filter-bar/filter-bar';  // ✅ Import FilterBar
import { CategoryTreeDto } from '../../../proxy/api/category.service';
import { ProvinceDto } from '../../../proxy/api/location.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],  // ✅ Add FilterBarComponent
  templateUrl: './hero-section.html',
  styleUrls: ['./hero-section.scss']
})
export class HeroSectionComponent {
  @Input() backgroundImage = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showSearchForm = true;
  
  // ✅ NEW: Nhận data từ parent (candidate-homepage)
  @Input() categories: CategoryTreeDto[] = [];
  @Input() provinces: ProvinceDto[] = [];
  
  // ✅ Emit filter events
  @Output() searchJobs = new EventEmitter<any>();
  @Output() categorySelected = new EventEmitter<string[]>();
  @Output() locationSelected = new EventEmitter<{provinceIds: number[], districtIds: number[]}>();

  searchKeyword = '';

  onSearch() {
    console.log('Hero search keyword:', this.searchKeyword);
    this.searchJobs.emit({ keyword: this.searchKeyword });
  }

  // ✅ Forward filter events từ FilterBar lên parent
  onCategorySelected(categoryIds: string[]) {
    this.categorySelected.emit(categoryIds);
  }

  onLocationSelected(location: {provinceIds: number[], districtIds: number[]}) {
    this.locationSelected.emit(location);
  }

  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}
