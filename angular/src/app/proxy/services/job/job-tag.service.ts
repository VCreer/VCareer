import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { JobTagViewDto, JobTagViewDto_JobTagCreateUpdateDto } from '../../dto/job-dto/models';

@Injectable({
  providedIn: 'root',
})
export class JobTagService {
  apiName = 'Default';
  

  addTagsToJobByDto = (dto: JobTagViewDto_JobTagCreateUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-tag/tags-to-job',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  getTagByJobIdByJobId = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobTagViewDto[]>({
      method: 'GET',
      url: `/api/app/job-tag/tag-by-job-id/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  getTagByTagIdByTagId = (tagId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobTagViewDto>({
      method: 'GET',
      url: `/api/app/job-tag/tag-by-tag-id/${tagId}`,
    },
    { apiName: this.apiName,...config });
  

  updateTagOfJobByDto = (dto: JobTagViewDto_JobTagCreateUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/job-tag/tag-of-job',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
