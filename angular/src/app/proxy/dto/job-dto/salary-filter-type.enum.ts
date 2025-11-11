import { mapEnumToOptions } from '@abp/ng.core';

export enum SalaryFilterType {
  All = 0,
  Under10 = 1,
  Range10To15 = 2,
  Range15To20 = 3,
  Range20To30 = 4,
  Range30To50 = 5,
  Over50 = 6,
  Deal = 7,
}

export const salaryFilterTypeOptions = mapEnumToOptions(SalaryFilterType);
