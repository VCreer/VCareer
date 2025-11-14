import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  selectedLanguage = 'vi';
  sidebarExpanded: boolean = false;
  cartItems: CartItem[] = [];
  selectedItems: Set<string> = new Set();
  agreeToTerms: boolean = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
  private cartSubscription?: Subscription;
  private sidebarCheckInterval?: any;

  // VAT rate
  readonly VAT_RATE = 0.08; // 8%

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.translationService.currentLanguage$.subscribe(lang => {
      this.selectedLanguage = lang;
    });

    // Load cart items
    this.loadCartItems();

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.loadCartItems();
    });

    // Check sidebar state
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  loadCartItems() {
    this.cartItems = this.cartService.getCartItems();
    // Auto-select all items
    this.selectedItems = new Set(this.cartItems.map(item => item.id));
  }

  checkSidebarState(): void {
    const sidebar = document.querySelector('app-sidebar .sidebar') as HTMLElement;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      const width = rect.width;
      // Consider sidebar expanded if it has 'show' class OR width > 100px (hover state)
      this.sidebarExpanded = sidebar.classList.contains('show') || width > 100;
    }
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  // Checkbox handlers
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedItems = new Set(this.cartItems.map(item => item.id));
    } else {
      this.selectedItems.clear();
    }
  }

  toggleSelectItem(itemId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedItems.add(itemId);
    } else {
      this.selectedItems.delete(itemId);
    }
  }

  isAllSelected(): boolean {
    return this.cartItems.length > 0 && this.selectedItems.size === this.cartItems.length;
  }

  isItemSelected(itemId: string): boolean {
    return this.selectedItems.has(itemId);
  }

  // Remove item
  removeItem(itemId: string): void {
    this.cartService.removeFromCart(itemId);
    this.selectedItems.delete(itemId);
    this.showToastMessage('success', 'Đã xóa sản phẩm khỏi giỏ hàng');
  }

  // Calculations
  getSelectedItems(): CartItem[] {
    return this.cartItems.filter(item => this.selectedItems.has(item.id));
  }

  getSubtotal(): number {
    return this.getSelectedItems().reduce((total, item) => {
      const price = parseFloat(item.price.replace(/,/g, ''));
      return total + (price * item.quantity);
    }, 0);
  }

  getVAT(): number {
    return this.getSubtotal() * this.VAT_RATE;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getVAT();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  getItemAmount(item: CartItem): number {
    const price = parseFloat(item.price.replace(/,/g, ''));
    return price * item.quantity;
  }

  // Actions
  onSelectDiscountCode(): void {
    // TODO: Implement discount code selection
    this.showToastMessage('info', 'Tính năng chọn mã ưu đãi đang được phát triển');
  }

  onCreateOrder(): void {
    if (!this.agreeToTerms) {
      this.showToastMessage('warning', 'Vui lòng đồng ý với Điều khoản dịch vụ');
      return;
    }

    if (this.getSelectedItems().length === 0) {
      this.showToastMessage('warning', 'Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    // TODO: Implement create order functionality
    this.showToastMessage('success', 'Đơn hàng đã được tạo thành công');
  }

  showToastMessage(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  onContinueShopping(): void {
    this.router.navigate(['/recruiter/buy-services']);
  }
}

