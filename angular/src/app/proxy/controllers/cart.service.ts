import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { AddToCartDto, CartDto, CartListDto, RemoveFromCartDto, UpdateCartQuantityDto } from '../dto/cart/models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  apiName = 'Default';
  

  addToCart = (input: AddToCartDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CartDto>({
      method: 'POST',
      url: '/api/app/cart/add-to-cart',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  clearCart = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/cart/clear-cart',
    },
    { apiName: this.apiName,...config });
  

  getMyCart = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CartListDto>({
      method: 'GET',
      url: '/api/app/cart/my-cart',
    },
    { apiName: this.apiName,...config });
  

  removeFromCart = (input: RemoveFromCartDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/cart/remove-from-cart',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateQuantity = (input: UpdateCartQuantityDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CartDto>({
      method: 'PUT',
      url: '/api/app/cart/update-quantity',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
