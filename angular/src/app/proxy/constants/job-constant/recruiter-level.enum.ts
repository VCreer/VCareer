import { mapEnumToOptions } from '@abp/ng.core';

export enum RecruiterLevel {
  Verified = 0,
  Trusted = 1,
  Premium = 2,
  Unverified = -1,
}

export const recruiterLevelOptions = mapEnumToOptions(RecruiterLevel);
