import { mapEnumToOptions } from '@abp/ng.core';

export enum JobPriorityLevel {
  Normal = 0,
  Feature = 1,
  Vip = 2,
}

export const jobPriorityLevelOptions = mapEnumToOptions(JobPriorityLevel);
