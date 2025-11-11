import { mapEnumToOptions } from '@abp/ng.core';

export enum RiskJobLevel {
  Low = 0,
  Normal = 1,
  Hight = 2,
  NonCalculated = -1,
}

export const riskJobLevelOptions = mapEnumToOptions(RiskJobLevel);
