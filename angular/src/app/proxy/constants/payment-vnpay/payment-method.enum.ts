import { mapEnumToOptions } from '@abp/ng.core';

export enum PaymentMethod {
  VNPay = 1,
  BankTransfer = 2,
  Cash = 3,
  Other = 99,
}

export const paymentMethodOptions = mapEnumToOptions(PaymentMethod);
