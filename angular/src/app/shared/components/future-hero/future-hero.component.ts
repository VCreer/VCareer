import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-future-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './future-hero.component.html',
  styleUrls: ['./future-hero.component.scss']
})
export class FutureHeroComponent {
  @Input() image = '';
  @Input() title = '';
  @Input() description = '';
  @Input() buttonText = '';
  @Output() buttonClick = new EventEmitter<void>();
  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }

  onButtonClick() {
    this.buttonClick.emit();
  }
}
