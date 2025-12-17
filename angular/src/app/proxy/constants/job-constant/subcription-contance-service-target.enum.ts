import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_ServiceTarget {
  JobPost = 0,
  Company = 1,
}

export const subcriptionContance_ServiceTargetOptions = mapEnumToOptions(SubcriptionContance_ServiceTarget);
