import type { FullAuditedEntityDto, PagedResultDto } from '@abp/ng.core';
import type { OrderStatus } from '../../constants/payment-vnpay/order-status.enum';
import type { PaymentStatus } from '../../constants/payment-vnpay/payment-status.enum';
import type { PaymentMethod } from '../../constants/payment-vnpay/payment-method.enum';
import type { OrderDto } from './models';

export interface CreateOrderDetailDto {
  subcriptionServiceId?: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateOrderDto {
  orderDetails: CreateOrderDetailDto[];
  discountCode?: string;
  notes?: string;
}

export interface OrderDetailDto extends FullAuditedEntityDto<string> {
  orderId?: string;
  subcriptionServiceId?: string;
  subcriptionServiceTitle?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface OrderDto extends FullAuditedEntityDto<string> {
  userId?: string;
  orderCode?: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  discountCode?: string;
  discountAmount?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  vnpayTransactionId?: string;
  vnpayResponseCode?: string;
  paidAt?: string;
  notes?: string;
  orderDetails: OrderDetailDto[];
}

export interface OrderListDto extends PagedResultDto<OrderDto> {
}

export interface VnpayPaymentRequestDto {
  orderId?: string;
}

export interface VnpayPaymentResponseDto {
  paymentUrl?: string;
  orderCode?: string;
}

export interface VnpayCallbackDto {
  vnp_TxnRef?: string;
  vnp_ResponseCode?: string;
  vnp_TransactionNo?: string;
  vnp_Amount?: string;
  vnp_SecureHash?: string;
}
