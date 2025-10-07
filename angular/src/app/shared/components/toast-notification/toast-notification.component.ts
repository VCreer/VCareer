import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.scss']
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  @Input() show: boolean = false;
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() duration: number = 3000;
  @Output() close = new EventEmitter<void>();

  private timeoutId?: number;

  ngOnInit(): void {
    if (this.show && this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.closeToast();
      }, this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  closeToast(): void {
    this.close.emit();
  }
}