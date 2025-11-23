import type { FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface ApplicationDto extends FullAuditedEntityDto<string> {
  jobId?: string;
  jobTitle?: string;
  candidateId?: string;
  candidateName?: string;
  companyId: number;
  companyName?: string;
  cvType?: string;
  candidateCvId?: string;
  candidateCvName?: string;
  uploadedCvId?: string;
  uploadedCvName?: string;
  coverLetter?: string;
  status?: string;
  recruiterNotes?: string;
  rating?: number;
  viewedAt?: string;
  respondedAt?: string;
  rejectionReason?: string;
  interviewDate?: string;
  interviewLocation?: string;
  interviewNotes?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
}

export interface ApplicationStatisticsDto {
  totalApplications: number;
  pendingApplications: number;
  reviewedApplications: number;
  shortlistedApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  withdrawnApplications: number;
  responseRate: number;
  acceptanceRate: number;
}

export interface ApplicationStatusDto {
  hasApplied: boolean;
  applicationId?: string;
  status?: string;
}

export interface ApplyWithOnlineCVDto {
  jobId: string;
  candidateCvId: string;
  coverLetter?: string;
}

export interface ApplyWithUploadedCVDto {
  jobId: string;
  uploadedCvId: string;
  coverLetter?: string;
}

export interface BulkDownloadCVsDto {
  jobId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetApplicationListDto extends PagedAndSortedResultRequestDto {
  jobId?: string;
  candidateId?: string;
  companyId?: number;
  status?: string;
  cvType?: string;
  fromDate?: string;
  toDate?: string;
  isViewed?: boolean;
  isResponded?: boolean;
}

export interface RateApplicationDto {
  rating: number;
  notes?: string;
}

export interface UpdateApplicationStatusDto {
  status: string;
  recruiterNotes?: string;
  rating?: number;
  rejectionReason?: string;
  interviewDate?: string;
  interviewLocation?: string;
  interviewNotes?: string;
}

export interface WithdrawApplicationDto {
  withdrawalReason?: string;
}
