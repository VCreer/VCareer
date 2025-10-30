import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { UnionJackComponent } from '../union-jack/union-jack';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule, UnionJackComponent],
  template: `
    <div class="language-toggle" (click)="toggleLanguageDropdown(); $event.stopPropagation()">
      <div class="flag-icon">
        <div class="flag-circle" [class.vi-flag]="selectedLanguage === 'vi'" [class.uk-flag]="selectedLanguage === 'en'">
          <div class="star" *ngIf="selectedLanguage === 'vi'">★</div>
          <app-union-jack *ngIf="selectedLanguage === 'en'"></app-union-jack>
        </div>
      </div>
      <div class="dropdown-arrow">▼</div>
      <div class="language-dropdown" [class.show]="showLanguageDropdown" (click)="$event.stopPropagation()">
        <div class="dropdown-item" (click)="selectLanguage('vi'); $event.stopPropagation()">
          <span class="country-code">vn</span>
          <span class="language-name">{{ translate('language.vietnamese') }}</span>
        </div>
        <div class="dropdown-item" (click)="selectLanguage('en'); $event.stopPropagation()">
          <span class="country-code">uk</span>
          <span class="language-name">{{ translate('language.english') }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .language-toggle {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid #E5E7EB;
      border-radius: 20px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #D1D5DB;
        background: #F9FAFB;
      }
      
      .flag-icon {
        .flag-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          
          &.vi-flag {
            background: #EF4444;
          }
          
          &.uk-flag {
            background: #1E3A8A;
          }
          
          .star {
            color: #FCD34D;
            font-size: 12px;
          }
        }
      }
      
      .dropdown-arrow {
        font-size: 10px;
        color: #6B7280;
      }
      
      .language-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 160px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        
        &.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          
          &:hover {
            background: #F9FAFB;
          }
          
          &:first-child {
            border-radius: 8px 8px 0 0;
          }
          
          &:last-child {
            border-radius: 0 0 8px 8px;
          }
          
          .country-code {
            font-size: 12px;
            color: #9CA3AF;
            font-weight: 500;
          }
          
          .language-name {
            font-size: 14px;
            color: #374151;
          }
        }
      }
    }
  `]
})
export class LanguageToggleComponent {
  @Input() selectedLanguage = 'vi';
  @Output() languageChange = new EventEmitter<string>();
  
  showLanguageDropdown = false;

  constructor(private translationService: TranslationService) {}

  toggleLanguageDropdown() {
    this.showLanguageDropdown = !this.showLanguageDropdown;
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
    this.showLanguageDropdown = false;
    this.translationService.setLanguage(lang);
    this.languageChange.emit(lang);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const languageToggle = target.closest('.language-toggle');
    
    if (!languageToggle && this.showLanguageDropdown) {
      this.showLanguageDropdown = false;
    }
  }
}
