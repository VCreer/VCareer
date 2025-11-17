import { mapEnumToOptions } from '@abp/ng.core';

export enum JobPriorityLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export const jobPriorityLevelOptions = mapEnumToOptions(JobPriorityLevel);
