import { mapEnumToOptions } from '@abp/ng.core';

export enum ExperienceLevel {
  None = 0,
  Under1 = 1,
  Year1 = 2,
  Year2 = 3,
  Year3 = 4,
  Year4 = 5,
  Year5 = 6,
  Year6 = 7,
  Year7 = 8,
  Year8 = 9,
  Year9 = 10,
  Year10 = 11,
  Over10 = 12,
}

export const experienceLevelOptions = mapEnumToOptions(ExperienceLevel);
