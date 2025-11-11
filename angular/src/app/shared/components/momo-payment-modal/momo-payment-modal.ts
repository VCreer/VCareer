import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-momo-payment-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './momo-payment-modal.html',
  styleUrls: ['./momo-payment-modal.scss']
})
export class MomoPaymentModalComponent implements OnDestroy, OnChanges {
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() decline = new EventEmitter<void>();

  countdown: number = 300;
  private countdownInterval?: any;

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']) {
      if (changes['show'].currentValue) {
        this.countdown = 300;
        this.startCountdown();
        document.body.style.overflow = 'hidden';
      } else {
        this.stopCountdown();
        document.body.style.overflow = '';
      }
    }
  }

  startCountdown(): void {
    this.stopCountdown();
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.stopCountdown();
        this.onClose();
      }
    }, 1000);
  }

  stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  onClose(): void {
    this.stopCountdown();
    this.close.emit();
  }

  onDecline(): void {
    this.stopCountdown();
    this.decline.emit();
  }
}

