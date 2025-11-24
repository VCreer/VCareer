import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../enums';

export interface CreateOrderDetailDto {
  subcriptionServiceId: string;
  quantity: number;
  unitPrice?: number; // Optional, backend will use price from subscription service if not provided
}

export interface CreateOrderDto {
  orderDetails: CreateOrderDetailDto[];
  discountCode?: string;
  notes?: string;
}

export interface OrderDetailDto {
  id: string;
  orderId: string;
  subcriptionServiceId: string;
  subcriptionServiceTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface OrderDto {
  id: string;
  userId: string;
  orderCode: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  discountCode?: string;
  discountAmount?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  vnpayTransactionId?: string;
  vnpayResponseCode?: string;
  paidAt?: string;
  notes?: string;
  orderDetails: OrderDetailDto[];
  creationTime: string;
}

export interface VnpayPaymentRequestDto {
  orderId: string;
}

export interface VnpayPaymentResponseDto {
  paymentUrl: string;
  orderCode: string;
}

export interface OrderListDto {
  items: OrderDto[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apis.default.url || 'https://localhost:44385';

  constructor(private http: HttpClient) {}

  /**
   * Create a new order
   */
  createOrder(order: CreateOrderDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.apiUrl}/api/orders`, order);
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/api/orders/${orderId}`);
  }

  /**
   * Get my orders
   */
  getMyOrders(): Observable<OrderListDto> {
    return this.http.get<OrderListDto>(`${this.apiUrl}/api/orders/my-orders`);
  }

  /**
   * Create VNPay payment URL
   */
  createVnpayPaymentUrl(request: VnpayPaymentRequestDto): Observable<VnpayPaymentResponseDto> {
    return this.http.post<VnpayPaymentResponseDto>(
      `${this.apiUrl}/api/orders/vnpay/create-payment-url`,
      request
    );
  }

  /**
   * Handle VNPay callback - process payment result from VNPay
   */
  handleVnpayCallback(params: any): Observable<OrderDto> {
    // Convert params object to query string
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams.append(key, params[key]);
      }
    });
    
    return this.http.get<OrderDto>(
      `${this.apiUrl}/api/orders/vnpay/callback?${queryParams.toString()}`
    );
  }
}

