import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_ServiceAction {
  BoostScoreCv = 0,
  BoostScoreJob = 1,
  TopList = 2,
  VerifiedBadge = 3,
  IncreaseQuota = 4,
  ExtendExpiredDate = 5,
}

export const subcriptionContance_ServiceActionOptions = mapEnumToOptions(SubcriptionContance_ServiceAction);
