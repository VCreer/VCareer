import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CreateOrderDto, OrderDto, OrderListDto, VnpayCallbackDto, VnpayPaymentRequestDto, VnpayPaymentResponseDto } from '../../dto/order/models';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  apiName = 'Default';
  

  createOrder = (input: CreateOrderDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderDto>({
      method: 'POST',
      url: '/api/app/order/order',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  createVnpayPaymentUrl = (input: VnpayPaymentRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, VnpayPaymentResponseDto>({
      method: 'POST',
      url: '/api/app/order/vnpay-payment-url',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getMyOrders = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderListDto>({
      method: 'GET',
      url: '/api/app/order/my-orders',
    },
    { apiName: this.apiName,...config });
  

  getOrder = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderDto>({
      method: 'GET',
      url: `/api/app/order/${id}/order`,
    },
    { apiName: this.apiName,...config });
  

  handleVnpayCallback = (input: VnpayCallbackDto, vnpayParams?: Record<string, string>, config?: Partial<Rest.Config>) =>
    this.restService.request<any, OrderDto>({
      method: 'POST',
      url: '/api/app/order/handle-vnpay-callback',
      body: vnpayParams,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
