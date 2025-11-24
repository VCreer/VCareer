import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';
import { ButtonComponent } from '../../../shared/components/button/button';
import { PaymentStatus } from '../../../core/enums';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent, ButtonComponent],
  templateUrl: './payment-callback.html',
  styleUrls: ['./payment-callback.scss']
})
export class PaymentCallbackComponent implements OnInit {
  orderId?: string;
  status?: string;
  error?: string;
  isLoading = true;
  paymentStatus: 'success' | 'failed' | 'pending' | 'error' = 'pending';
  orderDetails: any = null;
  selectedLanguage = 'vi';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private translationService: TranslationService
  ) {}

    ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'];
      this.status = params['status'];
      this.error = params['error'];

      // If we have VNPay callback params, process them first
      if (params['vnp_TxnRef'] && !this.orderId) {
        // VNPay callback - need to call backend to process
        this.processVnpayCallback(params);
      } else if (this.error) {
        this.paymentStatus = 'error';
        this.isLoading = false;
      } else if (this.orderId) {
        this.loadOrderDetails();
      } else {
        this.paymentStatus = 'error';
        this.isLoading = false;
      }
    });
  }

  processVnpayCallback(params: any) {
    // Call backend to process VNPay callback
    // The backend will validate and update order, then return order details
    this.orderService.handleVnpayCallback(params).subscribe({
      next: (order) => {
        this.orderDetails = order;
        this.orderId = order.id;
        
        // Determine payment status
        if (order.paymentStatus === PaymentStatus.Paid) {
          this.paymentStatus = 'success';
        } else if (order.paymentStatus === PaymentStatus.Failed) {
          this.paymentStatus = 'failed';
        } else {
          this.paymentStatus = 'pending';
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error processing VNPay callback:', error);
        this.paymentStatus = 'error';
        this.isLoading = false;
      }
    });
  }

  loadOrderDetails() {
    if (!this.orderId) {
      this.paymentStatus = 'error';
      this.isLoading = false;
      return;
    }

    this.orderService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.orderDetails = order;
        
        // Determine payment status based on PaymentStatus enum
        if (order.paymentStatus === PaymentStatus.Paid) {
          this.paymentStatus = 'success';
        } else if (order.paymentStatus === PaymentStatus.Failed) {
          this.paymentStatus = 'failed';
        } else if (order.paymentStatus === PaymentStatus.Processing) {
          this.paymentStatus = 'pending';
        } else {
          this.paymentStatus = 'pending';
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.paymentStatus = 'error';
        this.isLoading = false;
      }
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToOrders(): void {
    // Navigate to my-services or orders page if exists
    this.router.navigate(['/recruiter/my-services']);
  }

  goToBuyServices(): void {
    this.router.navigate(['/recruiter/buy-services']);
  }

  getStatusMessage(): string {
    switch (this.paymentStatus) {
      case 'success':
        return 'Thanh toán thành công!';
      case 'failed':
        return 'Thanh toán thất bại. Vui lòng thử lại.';
      case 'pending':
        return 'Đang xử lý thanh toán...';
      default:
        return 'Có lỗi xảy ra. Vui lòng liên hệ hỗ trợ.';
    }
  }

  getStatusIcon(): string {
    switch (this.paymentStatus) {
      case 'success':
        return 'fa-check-circle';
      case 'failed':
        return 'fa-times-circle';
      case 'pending':
        return 'fa-clock';
      default:
        return 'fa-exclamation-circle';
    }
  }
}

