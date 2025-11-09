import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ApplicationDto, ApplicationStatisticsDto, ApplyWithOnlineCVDto, ApplyWithUploadedCVDto, GetApplicationListDto, UpdateApplicationStatusDto, WithdrawApplicationDto } from '../../application/contracts/applications/models';
import type { IActionResult } from '../../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  apiName = 'Default';
  

  applyWithOnlineCV = (input: ApplyWithOnlineCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: '/api/applications/apply-with-online-cv',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  applyWithUploadedCV = (input: ApplyWithUploadedCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'POST',
      url: '/api/applications/apply-with-uploaded-cv',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteApplication = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/applications/${id}`,
    },
    { apiName: this.apiName,...config });
  

  downloadApplicationCV = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: `/api/applications/${id}/download-cv`,
    },
    { apiName: this.apiName,...config });
  

  getApplication = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'GET',
      url: `/api/applications/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getApplicationList = (input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: '/api/applications',
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getApplicationStatistics = (jobId?: string, companyId?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationStatisticsDto>({
      method: 'GET',
      url: '/api/applications/statistics',
      params: { jobId, companyId },
    },
    { apiName: this.apiName,...config });
  

  getCompanyApplications = (input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: '/api/applications/company-applications',
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getJobApplications = (jobId: string, input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: `/api/applications/job/${jobId}`,
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getMyApplications = (input: GetApplicationListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ApplicationDto>>({
      method: 'GET',
      url: '/api/applications/my-applications',
      params: { jobId: input.jobId, candidateId: input.candidateId, companyId: input.companyId, status: input.status, cvType: input.cvType, fromDate: input.fromDate, toDate: input.toDate, isViewed: input.isViewed, isResponded: input.isResponded, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  markAsViewed = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'PUT',
      url: `/api/applications/${id}/mark-viewed`,
    },
    { apiName: this.apiName,...config });
  

  updateApplicationStatus = (id: string, input: UpdateApplicationStatusDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'PUT',
      url: `/api/applications/${id}/status`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  withdrawApplication = (id: string, input: WithdrawApplicationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ApplicationDto>({
      method: 'PUT',
      url: `/api/applications/${id}/withdraw`,
      body: input,
    },
    { apiName: this.apiName,...config });

  checkApplicationStatus = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, { hasApplied: boolean; applicationId?: string; status?: string }>({
      method: 'GET',
      url: `/api/applications/check-status/${jobId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
