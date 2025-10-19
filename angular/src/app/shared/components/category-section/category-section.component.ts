import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-section.component.html',
  styleUrls: ['./category-section.component.scss']
})
export class CategorySectionComponent {
  @Input() categories: any[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();
  @Output() categoryClick = new EventEmitter<number>();
  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }

  onCategoryClick(categoryId: number) {
    this.categoryClick.emit(categoryId);
  }
}
