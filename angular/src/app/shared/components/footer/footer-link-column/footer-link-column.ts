import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../core/services/translation.service';

export interface FooterLink { label: string; url: string; }

@Component({
  selector: 'app-footer-link-column',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-link-column.html',
  styleUrls: ['./footer-link-column.scss']
})
export class FooterLinkColumnComponent {
  @Input() title = '';
  @Input() links: FooterLink[] = [];
  constructor(private translationService: TranslationService) {}
  translate(key: string): string { return this.translationService.translate(key); }
}


