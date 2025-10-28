import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.html',
  styleUrls: ['./toast-notification.scss']
})
export class ToastNotificationComponent implements OnInit, OnDestroy, OnChanges {
  @Input() show: boolean = false;
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() duration: number = 3000;
  @Output() close = new EventEmitter<void>();

  private timeoutId?: number;

  ngOnInit(): void {
    this.startTimeout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show) {
      this.startTimeout();
    }
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }

  private startTimeout(): void {
    this.clearTimeout();
    if (this.show && this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.closeToast();
      }, this.duration);
    }
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  closeToast(): void {
    this.close.emit();
  }
}
