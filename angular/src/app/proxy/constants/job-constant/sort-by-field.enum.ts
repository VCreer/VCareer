import { mapEnumToOptions } from '@abp/ng.core';

export enum SortByField {
  Relevance = 0,
  Salary = 1,
  Experience = 2,
  ExpiredAt = 3,
}

export const sortByFieldOptions = mapEnumToOptions(SortByField);
