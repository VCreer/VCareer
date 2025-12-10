import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  start: string; // Format: YYYY-MM-DD
  end: string;   // Format: YYYY-MM-DD
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-range-picker.html',
  styleUrls: ['./date-range-picker.scss']
})
export class DateRangePickerComponent implements OnInit, OnChanges {
  @Input() placeholder: string = 'Chọn khoảng thời gian';
  @Input() disabled: boolean = false;
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Output() dateRangeChange = new EventEmitter<DateRange>();

  showDropdown = false;
  internalStartDate = '';
  internalEndDate = '';

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.internalStartDate = this.startDate;
    this.internalEndDate = this.endDate;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate']) {
      this.internalStartDate = this.startDate;
    }
    if (changes['endDate']) {
      this.internalEndDate = this.endDate;
    }
  }

  toggleDropdown(event?: Event): void {
    if (this.disabled) return;
    // Ngăn event bubbling nếu click vào clear button hoặc các element con khác
    if (event) {
      const target = event.target as HTMLElement;
      // Không toggle nếu click vào clear button hoặc các input trong dropdown
      if (target.closest('.clear-btn') || target.closest('.date-picker-dropdown')) {
        return;
      }
    }
    this.showDropdown = !this.showDropdown;
  }

  onStartDateChange(): void {
    this.onDateChange();
  }

  onEndDateChange(): void {
    this.onDateChange();
  }

  private onDateChange(): void {
    if (this.internalStartDate && this.internalEndDate) {
      this.dateRangeChange.emit({
        start: this.internalStartDate,
        end: this.internalEndDate
      });
      // Tự động đóng dropdown sau khi chọn đủ cả 2 ngày
      setTimeout(() => {
        this.showDropdown = false;
      }, 100);
    }
  }

  getDisplayValue(): string {
    if (this.internalStartDate && this.internalEndDate) {
      const start = this.formatDateForDisplay(this.internalStartDate);
      const end = this.formatDateForDisplay(this.internalEndDate);
      return `${start} - ${end}`;
    }
    return '';
  }

  private formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  clearDateRange(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    
    this.internalStartDate = '';
    this.internalEndDate = '';
    this.dateRangeChange.emit({
      start: '',
      end: ''
    });
  }

  hasValue(): boolean {
    return !!(this.internalStartDate && this.internalEndDate);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Chỉ đóng dropdown nếu click bên ngoài component và không phải click vào input
    if (!this.elementRef.nativeElement.contains(target) && target.tagName !== 'INPUT') {
      this.showDropdown = false;
    }
  }
}

