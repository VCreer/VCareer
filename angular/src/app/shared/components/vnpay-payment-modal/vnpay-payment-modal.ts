import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaymentInfo {
  orderId?: string;
  totalAmount: number;
  services?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

@Component({
  selector: 'app-vnpay-payment-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vnpay-payment-modal.html',
  styleUrls: ['./vnpay-payment-modal.scss']
})
export class VnpayPaymentModalComponent implements OnDestroy, OnChanges {
  @Input() show: boolean = false;
  @Input() paymentInfo?: PaymentInfo;
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
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
