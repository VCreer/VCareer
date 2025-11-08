import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-candidate-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.scss']
})
export class CandidateAboutUsComponent implements OnInit {
  selectedLanguage = 'vi';

  constructor(
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

