import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectOption } from '../select-field/select-field';
import { JobOptionsService } from '../../services/job-options.service';

@Component({
  selector: 'app-multi-select-location',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multi-select-location.html',
  styleUrls: ['./multi-select-location.scss']
})
export class MultiSelectLocationComponent {
  @Input() label: string = 'Khu vực làm việc';
  @Input() required: boolean = false;
  @Input() options: SelectOption[] = [];
  @Input() selectedValues: string[] = [];
  @Input() error: string = '';
  // Cho phép tái sử dụng cho vị trí công việc nếu cần
  @Input() labelType: 'location' | 'jobPosition' = 'location';
  @Output() selectedValuesChange = new EventEmitter<string[]>();
  @Output() errorChange = new EventEmitter<string>();

  @ViewChild('locationDropdown', { static: false }) locationDropdown?: ElementRef;
  showLocationDropdown = false;
  private jobOptionsService = inject(JobOptionsService);

  toggleLocationDropdown(): void {
    this.showLocationDropdown = !this.showLocationDropdown;
  }

  closeLocationDropdown(): void {
    this.showLocationDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.locationDropdown && this.showLocationDropdown) {
      const clickedInside = this.locationDropdown.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closeLocationDropdown();
      }
    }
  }

  isLocationSelected(locationValue: string): boolean {
    return this.selectedValues.includes(locationValue);
  }

  toggleLocationSelection(locationValue: string): void {
    const index = this.selectedValues.indexOf(locationValue);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(locationValue);
    }
    this.selectedValuesChange.emit([...this.selectedValues]);
    this.clearError();
  }

  removeLocation(locationValue: string): void {
    const index = this.selectedValues.indexOf(locationValue);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      this.selectedValuesChange.emit([...this.selectedValues]);
      this.clearError();
    }
  }

  clearAllLocations(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedValues = [];
    this.selectedValuesChange.emit([]);
    this.clearError();
  }

  getLocationLabel(value: string): string {
    if (this.labelType === 'jobPosition') {
      return this.jobOptionsService.getJobPositionLabel(value);
    }
    return this.jobOptionsService.getLocationLabel(value);
  }

  private clearError(): void {
    if (this.error) {
      this.errorChange.emit('');
    }
  }
}

