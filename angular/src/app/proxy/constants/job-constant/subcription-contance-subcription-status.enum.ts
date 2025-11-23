import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_SubcriptionStatus {
  Inactive = 0,
  Active = 1,
  Expired = 2,
  Cancelled = 3,
}

export const subcriptionContance_SubcriptionStatusOptions = mapEnumToOptions(SubcriptionContance_SubcriptionStatus);
