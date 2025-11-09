import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-action-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon-action-button.html',
  styleUrls: ['./icon-action-button.scss']
})
export class IconActionButtonComponent {
  @Input() buttonClass: string = 'action-btn';
  @Input() ariaLabel: string = '';
  @Output() click = new EventEmitter<Event>();

  onClick(event: Event): void {
    this.click.emit(event);
  }
}

