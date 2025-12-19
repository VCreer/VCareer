import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

// Interface cho category với image
interface CategoryWithImage {
  id: string;
  name: string;
  jobCount: number;
  image: string;
}

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-section.html',
  styleUrls: ['./category-section.scss']
})
export class CategorySectionComponent {
  @Input() categories: CategoryWithImage[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();
  @Output() categoryClick = new EventEmitter<string>(); // Changed to string for categoryId

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onCategoryClick(categoryId: string) {
    this.categoryClick.emit(categoryId);
  }
}