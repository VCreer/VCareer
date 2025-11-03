import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon-button-badge.html',
  styleUrls: ['./icon-button-badge.scss']
})
export class IconButtonBadgeComponent {
  @Input() badgeCount: number = 0;
  @Input() showBadge: boolean = true;
  @Input() ariaLabel: string = '';
  @Input() buttonClass: string = 'icon-btn';
  @Output() click = new EventEmitter<Event>();

  onClick(event: Event): void {
    this.click.emit(event);
  }
}

