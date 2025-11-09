import { mapEnumToOptions } from '@abp/ng.core';

export enum EducationLevel {
  Any = 0,
  HighSchool = 1,
  College = 2,
  University = 3,
  Master = 4,
  Doctor = 5,
}

export const educationLevelOptions = mapEnumToOptions(EducationLevel);
