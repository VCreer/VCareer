import { mapEnumToOptions } from '@abp/ng.core';

export enum PaymentStatus {
  Pending = 0,
  Processing = 1,
  Paid = 2,
  Failed = 3,
  Refunded = 4,
}

export const paymentStatusOptions = mapEnumToOptions(PaymentStatus);
