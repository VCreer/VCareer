import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

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
  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }

  onPrimaryClick() {
    this.primaryButtonClick.emit();
  }

  onSecondaryClick() {
    this.secondaryButtonClick.emit();
  }
}
