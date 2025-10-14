import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../core/services/translation.service';

export interface SocialLink { icon: string; url: string; label: string; }

@Component({
  selector: 'app-footer-social',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-social.component.html',
  styleUrls: ['./footer-social.component.scss']
})
export class FooterSocialComponent {
  @Input() socialLinks: SocialLink[] = [];
  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}


