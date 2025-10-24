import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.scss']
})
export class StatisticsComponent {
  @Input() statistics: any[] = [];
  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}
