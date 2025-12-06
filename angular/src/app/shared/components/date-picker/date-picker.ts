import { Component, Input, Output, EventEmitter, HostListener, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.html',
  styleUrls: ['./date-picker.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ]
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'mm/dd/yyyy';
  @Input() disabled: boolean = false;
  @Output() dateChange = new EventEmitter<string>();

  value: string = '';
  showCalendar = false;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDate: Date | null = null;
  calendarDays: any[] = [];

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {
    this.generateCalendar();
  }

  toggleCalendar(): void {
    if (this.disabled) return;
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.generateCalendar();
    }
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ date: '', disabled: true });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const isSelected = this.selectedDate && 
        date.getDate() === this.selectedDate.getDate() &&
        date.getMonth() === this.selectedDate.getMonth() &&
        date.getFullYear() === this.selectedDate.getFullYear();
      
      this.calendarDays.push({
        date: day,
        fullDate: date,
        disabled: false,
        isSelected: isSelected,
        isToday: this.isToday(date)
      });
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  selectDate(day: any): void {
    if (day.disabled) return;
    
    this.selectedDate = day.fullDate;
    const year = day.fullDate.getFullYear();
    const month = String(day.fullDate.getMonth() + 1).padStart(2, '0');
    const date = String(day.fullDate.getDate()).padStart(2, '0');
    this.value = `${year}-${month}-${date}`;
    
    this.onChange(this.value);
    this.onTouched();
    this.dateChange.emit(this.value);
    this.showCalendar = false;
    this.generateCalendar();
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.selectDate({
      fullDate: today,
      disabled: false
    });
  }

  clearDate(): void {
    this.value = '';
    this.selectedDate = null;
    this.onChange('');
    this.onTouched();
    this.dateChange.emit('');
    this.generateCalendar();
  }

  getMonthName(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.currentMonth];
  }

  getDisplayValue(): string {
    if (!this.value) return this.placeholder;
    const date = new Date(this.value);
    if (isNaN(date.getTime())) return this.placeholder;
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showCalendar = false;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (this.value) {
      this.selectedDate = new Date(this.value);
      this.currentMonth = this.selectedDate.getMonth();
      this.currentYear = this.selectedDate.getFullYear();
    } else {
      this.selectedDate = null;
    }
    this.generateCalendar();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

