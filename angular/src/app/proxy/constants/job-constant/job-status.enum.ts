import { mapEnumToOptions } from '@abp/ng.core';

export enum JobStatus {
  Draft = 1,
  Open = 2,
  Closed = 3,
  Expired = 4,
  Rejected = 5,
  Deleted = 7,
}

export const jobStatusOptions = mapEnumToOptions(JobStatus);
