import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';
import { FilterBarComponent } from '../filter-bar/filter-bar'; // ✅ Import FilterBar
import { CategoryTreeDto } from '../../../apiTest/api/category.service';
import { ProvinceDto } from '../../../apiTest/api/location.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent], // ✅ Add FilterBarComponent
  templateUrl: './hero-section.html',
  styleUrls: ['./hero-section.scss'],
})
export class HeroSectionComponent {
  @Input() backgroundImage = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showSearchForm = true;

  // ✅ NEW: Nhận data từ parent (candidate-homepage)
  @Input() categories: CategoryTreeDto[] = [];
  @Input() provinces: ProvinceDto[] = [];
  
  // ✅ Statistics từ API
  @Input() totalJobCount: number = 0;
  @Input() totalCategoryCount: number = 0;
  @Input() totalProvinceCount: number = 0;

  // ✅ Emit filter events
  @Output() searchJobs = new EventEmitter<any>();
  @Output() categorySelected = new EventEmitter<string[]>();
  @Output() locationSelected = new EventEmitter<{ provinceIds: number[]; districtIds: number[] }>();

  searchKeyword = '';

  onSearch() {
    console.log('Hero search keyword:', this.searchKeyword);
    this.searchJobs.emit({ keyword: this.searchKeyword });
  }

  // ✅ Forward filter events từ FilterBar lên parent
  onCategorySelected(categoryIds: string[]) {
    this.categorySelected.emit(categoryIds);
  }

  onLocationSelected(location: { provinceIds: number[]; districtIds: number[] }) {
    this.locationSelected.emit(location);
  }

  constructor(private translationService: TranslationService) {}
  translate(key: string): string {
    return this.translationService.translate(key);
  }

  /**
   * ✅ Format số với dấu phẩy (ví dụ: 25850 -> "25,850")
   */
  formatNumber(num: number): string {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('vi-VN');
  }

  /**
   * ✅ Format số với ký hiệu k+ (ví dụ: 25850 -> "25.8k+")
   */
  formatNumberShort(num: number): string {
    if (!num && num !== 0) return '0';
    if (num >= 1000) {
      const k = num / 1000;
      return k % 1 === 0 ? `${k}k+` : `${k.toFixed(1)}k+`;
    }
    return num.toString();
  }
}
