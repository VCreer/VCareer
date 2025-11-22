import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_ChildServiceStatus {
  Inactive = 0,
  Active = 1,
  Expired = 2,
}

export const subcriptionContance_ChildServiceStatusOptions = mapEnumToOptions(SubcriptionContance_ChildServiceStatus);
