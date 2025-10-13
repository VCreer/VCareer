import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent {
  @Input() image = '';
  @Input() title = '';
  @Input() description = '';
  @Input() primaryButtonText = '';
  @Input() secondaryButtonText = '';
  @Output() primaryButtonClick = new EventEmitter<void>();
  @Output() secondaryButtonClick = new EventEmitter<void>();

  onPrimaryClick() {
    this.primaryButtonClick.emit();
  }

  onSecondaryClick() {
    this.secondaryButtonClick.emit();
  }
}
