import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { JobStatus } from '../../constants/job-constant/job-status.enum';
import type { JobApproveViewDto, JobFilterDto, JobPostCreateDto, JobPostStatisticDto, JobPostUpdateDto, JobViewDto, JobViewWithPriorityDto } from '../../dto/job-dto/models';

@Injectable({
  providedIn: 'root',
})
export class JobPostService {
  apiName = 'Default';
  

  approveJobPost = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-post/${id}/approve-job-post`,
    },
    { apiName: this.apiName,...config });
  

  closeJobPostById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-post/${id}/close-job-post`,
    },
    { apiName: this.apiName,...config });
  

  createJobPostByDto = (dto: JobPostCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-post/job-post',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  createJobPostByOldPostByDto = (dto: JobPostCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-post/job-post-by-old-post',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  deleteJobPostById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/job-post/${id}/job-post`,
    },
    { apiName: this.apiName,...config });
  

  executeExpiredJobPostAutomaticallyById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-post/${id}/execute-expired-job-post-automatically`,
    },
    { apiName: this.apiName,...config });
  

  getJobByCompanyIdByCompanyIdAndMaxCount = (companyId: number, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'GET',
      url: `/api/app/job-post/job-by-company-id/${companyId}`,
      params: { maxCount },
    },
    { apiName: this.apiName,...config });
  

  getJobByRecruiterIdByIdAndMaxCount = (id: string, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewWithPriorityDto[]>({
      method: 'GET',
      url: `/api/app/job-post/${id}/job-by-recruiter-id`,
      params: { maxCount },
    },
    { apiName: this.apiName,...config });
  

  getJobPostBySatusByStatusAndMaxCount = (status: JobStatus, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'GET',
      url: '/api/app/job-post/job-post-by-satus',
      params: { status, maxCount },
    },
    { apiName: this.apiName,...config });
  

  getJobPostStatisticById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobPostStatisticDto>({
      method: 'GET',
      url: `/api/app/job-post/${id}/job-post-statistic`,
    },
    { apiName: this.apiName,...config });
  

  rejectJobPost = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-post/${id}/reject-job-post`,
    },
    { apiName: this.apiName,...config });
  

  showJobPostNeedApproveByDto = (dto: JobFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobApproveViewDto[]>({
      method: 'POST',
      url: '/api/app/job-post/show-job-post-need-approve',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  upDateViewCountById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: `/api/app/job-post/${id}/up-date-view-count`,
    },
    { apiName: this.apiName,...config });
  

  updateApplyCountById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: `/api/app/job-post/${id}/apply-count`,
    },
    { apiName: this.apiName,...config });
  

  updateExpiredJobPostById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: `/api/app/job-post/${id}/expired-job-post`,
    },
    { apiName: this.apiName,...config });
  

  updateJobPostByDto = (dto: JobPostUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/job-post/job-post',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
