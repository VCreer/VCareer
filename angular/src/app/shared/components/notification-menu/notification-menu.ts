import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

export interface NotificationItem {
  id: string;
  text: string;
  date: string;
  isRead?: boolean;
}

@Component({
  selector: 'app-notification-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-menu.html',
  styleUrls: ['./notification-menu.scss']
})
export class NotificationMenuComponent {
  @Input() notifications: NotificationItem[] = [];
  @Input() showMenu: boolean = false;
  @Output() markAllRead = new EventEmitter<void>();
  @Output() closeMenu = new EventEmitter<void>();

  constructor(private translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onMarkAllRead() {
    this.markAllRead.emit();
  }

  onCloseMenu() {
    this.closeMenu.emit();
  }
}

