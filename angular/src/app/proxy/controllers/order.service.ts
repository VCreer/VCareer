import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CreateOrderDto, OrderDto, OrderListDto, VnpayPaymentRequestDto, VnpayPaymentResponseDto } from '../dto/order/models';
import type { IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  apiName = 'Default';
  

  createOrder = (input: CreateOrderDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderDto>({
      method: 'POST',
      url: '/api/orders',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  createVnpayPaymentUrl = (input: VnpayPaymentRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, VnpayPaymentResponseDto>({
      method: 'POST',
      url: '/api/orders/vnpay/create-payment-url',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getMyOrders = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderListDto>({
      method: 'GET',
      url: '/api/orders/my-orders',
    },
    { apiName: this.apiName,...config });
  

  getOrder = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderDto>({
      method: 'GET',
      url: `/api/orders/${id}`,
    },
    { apiName: this.apiName,...config });
  

  handleVnpayCallback = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: '/api/orders/vnpay/callback',
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
