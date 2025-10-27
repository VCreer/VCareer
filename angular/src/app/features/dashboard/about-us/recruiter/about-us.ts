import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss'
})
export class AboutUs {
  selectedLanguage: string = 'vi';

  constructor(private translationService: TranslationService) {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
