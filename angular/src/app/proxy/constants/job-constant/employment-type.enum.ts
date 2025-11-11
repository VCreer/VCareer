import { mapEnumToOptions } from '@abp/ng.core';

export enum EmploymentType {
  PartTime = 1,
  FullTime = 2,
  Internship = 3,
  Contract = 4,
  Freelance = 5,
  Other = 6,
}

export const employmentTypeOptions = mapEnumToOptions(EmploymentType);
