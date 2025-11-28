import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-field.html',
  styleUrls: ['./select-field.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true
    }
  ]
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Chọn...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() options: SelectOption[] = [];
  @Input() error: string = '';

  @Output() valueChange = new EventEmitter<string>();

  value: string = '';
  showDropdown = false;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    if (this.disabled) return;
    this.showDropdown = !this.showDropdown;
  }

  onSelectOption(optionValue: string): void {
    if (this.disabled) return;
    
    this.value = optionValue;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
    this.showDropdown = false;
  }

  getSelectedLabel(): string {
    if (!this.value || this.value === '') {
      return this.placeholder;
    }
    const option = this.options.find(opt => opt.value === this.value);
    return option ? option.label : this.placeholder;
  }

  clearSelection(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;
    
    this.value = '';
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
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

