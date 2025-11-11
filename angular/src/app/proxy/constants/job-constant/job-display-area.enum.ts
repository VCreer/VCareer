import { mapEnumToOptions } from '@abp/ng.core';

export enum JobDisplayArea {
  MainMenuPage = 0,
  JobSimilarPage = 1,
  JobLocationPage = 2,
  JobCategorPage = 3,
}

export const jobDisplayAreaOptions = mapEnumToOptions(JobDisplayArea);
