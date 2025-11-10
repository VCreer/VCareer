import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { JobSearchInputDto, JobViewDetail, JobViewDto, PagedResultDto, SavedJobDto, SavedJobStatusDto } from '../dto/job/models';
import type { ActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class JobPostingService {
  apiName = 'Default';
  

  getJobById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<JobViewDetail>>({
      method: 'GET',
      url: `/api/jobs/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getJobBySlug = (slug: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<JobViewDetail>>({
      method: 'GET',
      url: `/api/jobs/slug/${slug}`,
    },
    { apiName: this.apiName,...config });
  

  getRelatedJobs = (id: string, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any<JobViewDto>>>({
      method: 'GET',
      url: `/api/jobs/${id}/related`,
      params: { maxCount },
    },
    { apiName: this.apiName,...config });
  

  getSavedJobStatus = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<SavedJobStatusDto>>({
      method: 'GET',
      url: `/api/jobs/${jobId}/save-status`,
    },
    { apiName: this.apiName,...config });
  

  getSavedJobs = (skipCount?: number, maxResultCount: number = 20, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<SavedJobDto>>>({
      method: 'GET',
      url: '/api/jobs/saved',
      params: { skipCount, maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  indexJob = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult>({
      method: 'POST',
      url: `/api/jobs/${id}/index`,
    },
    { apiName: this.apiName,...config });
  

  reindexAllJobs = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult>({
      method: 'POST',
      url: '/api/jobs/reindex',
    },
    { apiName: this.apiName,...config });
  

  removeJobFromIndex = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult>({
      method: 'DELETE',
      url: `/api/jobs/${id}/index`,
    },
    { apiName: this.apiName,...config });
  

  saveJob = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult>({
      method: 'POST',
      url: `/api/jobs/${jobId}/save`,
    },
    { apiName: this.apiName,...config });
  

  searchJobs = (input: JobSearchInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<JobViewDto>>>({
      method: 'POST',
      url: '/api/jobs/search',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  unsaveJob = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult>({
      method: 'DELETE',
      url: `/api/jobs/${jobId}/save`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
