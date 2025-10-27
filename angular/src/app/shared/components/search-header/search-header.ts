import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-header',
  templateUrl: './search-header.html',
  styleUrls: ['./search-header.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class SearchHeaderComponent {
  // Inputs
  @Input() selectedCategory: string = '';
  @Input() selectedLocation: string = '';
  @Input() searchPosition: string = '';
  @Input() categoryPlaceholder: string = 'Chọn danh mục';
  @Input() positionPlaceholder: string = 'Nhập vị trí';
  @Input() locationPlaceholder: string = 'Chọn địa điểm';
  @Input() searchButton: string = 'Tìm kiếm';
  @Input() categories: any = {};
  @Input() locationLongAn: string = '';
  @Input() locationHanoi: string = '';
  @Input() locationHcm: string = '';
  @Input() locationDanang: string = '';
  @Input() pageTitle: string = 'Tìm kiếm việc làm';
  @Input() showPageTitle: boolean = true;

  // Outputs
  @Output() categoryChange = new EventEmitter<any>();
  @Output() locationChange = new EventEmitter<any>();
  @Output() positionChange = new EventEmitter<any>();
  @Output() search = new EventEmitter<void>();
  @Output() clearPosition = new EventEmitter<void>();

  onCategoryChange(event: any) {
    this.categoryChange.emit(event);
  }

  onLocationChange(event: any) {
    this.locationChange.emit(event);
  }

  onPositionChange(event: any) {
    this.positionChange.emit(event);
  }

  onSearch() {
    this.search.emit();
  }

  onClearPosition() {
    this.searchPosition = '';
    this.clearPosition.emit();
  }
}
