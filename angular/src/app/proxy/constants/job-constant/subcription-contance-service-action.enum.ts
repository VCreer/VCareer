import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_ServiceAction {
  BoostScoreJob = 0,
  TopList = 1,
  JobBadge = 2,
  ThemeCompany = 3,
}

export const subcriptionContance_ServiceActionOptions = mapEnumToOptions(SubcriptionContance_ServiceAction);
