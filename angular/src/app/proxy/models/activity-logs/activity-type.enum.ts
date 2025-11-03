import { mapEnumToOptions } from '@abp/ng.core';

export enum ActivityType {
  JobPosted = 1,
  JobUpdated = 2,
  JobClosed = 3,
  JobDeleted = 4,
  EmailSent = 10,
  EmailTemplateCreated = 11,
  CandidateEvaluated = 20,
  CandidateRejected = 21,
  CandidateApproved = 22,
  CandidateShortlisted = 23,
  InterviewScheduled = 30,
  InterviewCompleted = 31,
  InterviewCancelled = 32,
  ApplicationReviewed = 40,
  ApplicationUpdated = 41,
}

export const activityTypeOptions = mapEnumToOptions(ActivityType);
