import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FooterLink { label: string; url: string; }

@Component({
  selector: 'app-footer-link-column',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-link-column.component.html',
  styleUrls: ['./footer-link-column.component.scss']
})
export class FooterLinkColumnComponent {
  @Input() title = '';
  @Input() links: FooterLink[] = [];
}


