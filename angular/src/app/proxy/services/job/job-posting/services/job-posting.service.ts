import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { JobSearchInputDto, JobViewDetail, JobViewDto, PagedResultDto } from '../../../../dto/job/models';

@Injectable({
  providedIn: 'root',
})
export class JobPostingService {
  apiName = 'Default';
  

  getJobById = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDetail>({
      method: 'GET',
      url: `/api/app/job-posting/job-by-id/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  getJobBySlug = (slug: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDetail>({
      method: 'GET',
      url: '/api/app/job-posting/job-by-slug',
      params: { slug },
    },
    { apiName: this.apiName,...config });
  

  getRelatedJobs = (jobId: string, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'GET',
      url: `/api/app/job-posting/related-jobs/${jobId}`,
      params: { maxCount },
    },
    { apiName: this.apiName,...config });
  

  indexJob = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-posting/index-job/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  reindexAllJobs = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-posting/reindex-all-jobs',
    },
    { apiName: this.apiName,...config });
  

  removeJobFromIndex = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/job-posting/job-from-index/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  searchJobs = (input: JobSearchInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<JobViewDto>>({
      method: 'POST',
      url: '/api/app/job-posting/search-jobs',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
