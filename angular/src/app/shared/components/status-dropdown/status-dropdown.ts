import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-status-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-dropdown.html',
  styleUrls: ['./status-dropdown.scss']
})
export class StatusDropdownComponent {
  @Input() options: StatusOption[] = [];
  @Input() selectedValue: string = '';
  @Input() placeholder: string = 'Chọn trạng thái';
  @Output() statusChange = new EventEmitter<string>();

  showDropdown = false;

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  onStatusSelect(value: string): void {
    this.statusChange.emit(value);
    this.showDropdown = false;
  }

  getSelectedLabel(): string {
    const option = this.options.find(opt => opt.value === this.selectedValue);
    return option ? option.label : this.placeholder;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}

