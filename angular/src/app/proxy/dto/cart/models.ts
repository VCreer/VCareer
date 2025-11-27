import type { EntityDto } from '@abp/ng.core';

export interface AddToCartDto {
  subscriptionServiceId?: string;
  quantity: number;
}

export interface CartDto extends EntityDto<string> {
  userId?: string;
  subscriptionServiceId?: string;
  subscriptionServiceTitle?: string;
  subscriptionServicePrice: number;
  quantity: number;
  creationTime?: string;
}

export interface CartListDto {
  items: CartDto[];
  totalCount: number;
}

export interface RemoveFromCartDto {
  cartId?: string;
}

export interface UpdateCartQuantityDto {
  cartId?: string;
  quantity: number;
}
