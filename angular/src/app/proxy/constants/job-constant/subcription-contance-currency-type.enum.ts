import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_CurrencyType {
  VND = 1,
  USD = 2,
}

export const subcriptionContance_CurrencyTypeOptions = mapEnumToOptions(SubcriptionContance_CurrencyType);
