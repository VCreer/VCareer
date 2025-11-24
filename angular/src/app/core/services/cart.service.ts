import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: string;
  title: string;
  price: string; // Formatted price for display
  originalPrice: number; // Original price from database for calculation
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
  public cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();

  private readonly CART_STORAGE_KEY = 'recruiter_cart';

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  getCartCount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  addToCart(item: Omit<CartItem, 'quantity'>): boolean {
    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);

    if (existingItemIndex >= 0) {
      // Item already exists, increase quantity
      currentItems[existingItemIndex].quantity += 1;
    } else {
      // New item, add with quantity 1
      currentItems.push({ ...item, quantity: 1 });
    }

    this.cartItemsSubject.next([...currentItems]);
    this.saveCartToStorage(currentItems);
    return true;
  }

  removeFromCart(itemId: string): void {
    const currentItems = this.cartItemsSubject.value.filter(item => item.id !== itemId);
    this.cartItemsSubject.next(currentItems);
    this.saveCartToStorage(currentItems);
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const currentItems = this.cartItemsSubject.value.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    this.cartItemsSubject.next(currentItems);
    this.saveCartToStorage(currentItems);
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    this.saveCartToStorage([]);
  }
}

