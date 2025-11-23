import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ApplicationDto, ApplicationStatisticsDto, ApplicationStatusDto, ApplyWithOnlineCVDto, ApplyWithUploadedCVDto, BulkDownloadCVsDto, GetApplicationListDto, RateApplicationDto, UpdateApplicationStatusDto, WithdrawApplicationDto } from '../contracts/applications/models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  apiName = 'Default';
  

  applyWithOnlineCV = (input: ApplyWithOnlineCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: '/api/app/application/apply-with-online-cV',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  applyWithUploadedCV = (input: ApplyWithUploadedCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: '/api/app/application/apply-with-uploaded-cV',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  bulkDownloadCompanyCVs = (input: BulkDownloadCVsDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number[]>({
      method: 'POST',
      url: '/api/app/application/bulk-download-company-cVs',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  checkApplicationStatus = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationStatusDto>({
      method: 'POST',
      url: `/api/app/application/check-application-status/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  deleteApplication = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/application/${id}/application`,
    },
    { apiName: this.apiName,...config });
  

  downloadApplicationCV = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number[]>({
      method: 'POST',
      url: `/api/app/application/${id}/download-application-cV`,
    },
    { apiName: this.apiName,...config });
  

  getApplication = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'GET',
      url: `/api/app/application/${id}/application`,
    },
    { apiName: this.apiName,...config });
  

  getApplicationList = (input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: '/api/app/application/application-list',
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getApplicationStatistics = (jobId?: string, companyId?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationStatisticsDto>({
      method: 'GET',
      url: '/api/app/application/application-statistics',
      params: { jobId, companyId },
    },
    { apiName: this.apiName,...config });
  

  getCompanyApplications = (input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: '/api/app/application/company-applications',
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getJobApplications = (jobId: string, input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: `/api/app/application/job-applications/${input.jobId}`,
      params: { jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getMyApplications = (input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: '/api/app/application/my-applications',
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  markAsViewed = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: `/api/app/application/${id}/mark-as-viewed`,
    },
    { apiName: this.apiName,...config });
  

  rateApplication = (id: string, input: RateApplicationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: `/api/app/application/${id}/rate-application`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateApplicationStatus = (id: string, input: UpdateApplicationStatusDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'PUT',
      url: `/api/app/application/${id}/application-status`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  withdrawApplication = (id: string, input: WithdrawApplicationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: `/api/app/application/${id}/withdraw-application`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
