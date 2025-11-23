import { mapEnumToOptions } from '@abp/ng.core';

export enum SubcriptionContance_SubcriptorTarget {
  Candidate = 0,
  Recruiter = 1,
}

export const subcriptionContance_SubcriptorTargetOptions = mapEnumToOptions(SubcriptionContance_SubcriptorTarget);
