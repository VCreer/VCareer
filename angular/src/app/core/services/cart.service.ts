import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: string;
  userId: string;
  subscriptionServiceId: string;
  subscriptionServiceTitle: string;
  subscriptionServicePrice: number;
  quantity: number;
  creationTime?: string;
  lastModificationTime?: string;
}

export interface CartListDto {
  items: CartItem[];
  totalCount: number;
}

export interface AddToCartDto {
  subscriptionServiceId: string;
  quantity?: number;
}

export interface UpdateCartQuantityDto {
  cartId: string;
  quantity: number;
}

export interface RemoveFromCartDto {
  cartId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apis.default.url || 'https://localhost:44385';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();
  private isLoading = false;

  constructor(private http: HttpClient) {
    // Load cart from API on service initialization
    this.loadCartFromApi();
  }

  /**
   * Load cart items from API
   */
  loadCartFromApi(): void {
    if (this.isLoading) {
      return; // Prevent multiple simultaneous requests
    }

    this.isLoading = true;
    this.http.get<CartListDto>(`${this.apiUrl}/api/app/cart/my-cart`).subscribe({
      next: (response) => {
        this.cartItemsSubject.next(response.items || []);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cart from API:', error);
        this.cartItemsSubject.next([]);
        this.isLoading = false;
      }
    });
  }

  /**
   * Get current cart items (synchronous)
   */
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  /**
   * Get cart count
   */
  getCartCount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Add item to cart
   */
  addToCart(item: Omit<CartItem, 'quantity' | 'userId' | 'subscriptionServiceTitle' | 'subscriptionServicePrice' | 'creationTime' | 'lastModificationTime'>): Observable<CartItem> {
    const addToCartDto: AddToCartDto = {
      subscriptionServiceId: item.subscriptionServiceId,
      quantity: 1 // Default quantity is 1
    };

    return this.http.post<CartItem>(`${this.apiUrl}/api/app/cart/add-to-cart`, addToCartDto).pipe(
      tap(() => {
        // Reload cart from API to get updated list after a short delay
        setTimeout(() => {
          this.loadCartFromApi();
        }, 100);
      })
    );
  }

  /**
   * Update quantity of a cart item
   */
  updateQuantity(cartId: string, quantity: number): Observable<CartItem> {
    const updateDto: UpdateCartQuantityDto = {
      cartId: cartId,
      quantity: quantity
    };

    return this.http.put<CartItem>(`${this.apiUrl}/api/app/cart/update-quantity`, updateDto).pipe(
      tap(() => {
        // Reload cart from API to get updated list
        this.loadCartFromApi();
      })
    );
  }

  /**
   * Remove item from cart
   */
  removeFromCart(cartId: string): Observable<void> {
    const removeDto: RemoveFromCartDto = {
      cartId: cartId
    };

    return this.http.post<void>(`${this.apiUrl}/api/app/cart/remove-from-cart`, removeDto).pipe(
      tap(() => {
        // Reload cart from API to get updated list
        this.loadCartFromApi();
      })
    );
  }

  /**
   * Clear entire cart
   */
  clearCart(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/app/cart/clear-cart`, {}).pipe(
      tap(() => {
        this.cartItemsSubject.next([]);
      })
    );
  }
}
