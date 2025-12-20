import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { PagedResultDto } from '@abp/ng.core';
import type { JobSearchInputDto, JobViewDto } from '../../dto/job-dto/models';
import type { JobViewDetail, SavedJobDto, SavedJobStatusDto } from '../../dto/job/models';

@Injectable({
  providedIn: 'root',
})
export class JobSearchService {
  apiName = 'Default';
  

  getJobById = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDetail>({
      method: 'GET',
      url: `/api/app/job-search/job-by-id/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  getRelatedJobs = (jobId: string, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'GET',
      url: `/api/app/job-search/related-jobs/${jobId}`,
      params: { maxCount },
    },
    { apiName: this.apiName,...config });
  

  searchJobs = (input: JobSearchInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'POST',
      url: '/api/app/job-search/search-jobs',
      body: input,
    },
    { apiName: this.apiName,...config });

  getSavedJobs = (skipCount?: number, maxResultCount: number = 20, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<SavedJobDto>>({
      method: 'GET',
      url: '/api/app/job-search/saved-jobs',
      params: { skipCount, maxResultCount },
    },
    { apiName: this.apiName,...config });

  saveJob = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-search/save-job/${jobId}`,
    },
    { apiName: this.apiName,...config });

  unsaveJob = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-search/unsave-job/${jobId}`,
    },
    { apiName: this.apiName,...config });

  getSavedJobStatus = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SavedJobStatusDto>({
      method: 'GET',
      url: `/api/app/job-search/saved-job-status/${jobId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
