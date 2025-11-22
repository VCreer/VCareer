import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_ServiceTarget {
  Job = 0,
  Company = 1,
  Recruiter = 2,
  Candidate = 3,
}

export const subcriptionContance_ServiceTargetOptions = mapEnumToOptions(SubcriptionContance_ServiceTarget);
