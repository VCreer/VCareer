import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { JobApproveViewDto, JobFilterDto, JobPostCreateDto, JobPostStatisticDto, JobPostUpdateDto, JobRequestViewDto, JobViewDto, JobViewManageDetailDto, PostJobDto } from '../../dto/job-dto/models';

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
  

  countJobByStatusByStatus = (status: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'POST',
      url: '/api/app/job-post/count-job-by-status',
      params: { status },
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
  

  executeExpiredJobPostBackgoundWorker = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-post/execute-expired-job-post-backgound-worker',
    },
    { apiName: this.apiName,...config });
  

  getJobByCompanyIdByCompanyIdAndPageAndPageSize = (companyId: number, page?: number, pageSize: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'GET',
      url: `/api/app/job-post/job-by-company-id/${companyId}`,
      params: { page, pageSize },
    },
    { apiName: this.apiName,...config });
  

  getJobByRecruiterIdByIdAndMaxCount = (id: string, maxCount: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDto[]>({
      method: 'GET',
      url: `/api/app/job-post/${id}/job-by-recruiter-id`,
      params: { maxCount },
    },
    { apiName: this.apiName,...config });
  

  getJobPostManageByDto = (dto: JobRequestViewDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewManageDetailDto[]>({
      method: 'GET',
      url: '/api/app/job-post/job-post-manage',
      params: { searchField: dto.searchField, status: dto.status, startTime: dto.startTime, endTime: dto.endTime, page: dto.page, pageSize: dto.pageSize },
    },
    { apiName: this.apiName,...config });
  

  getJobPostStatisticById = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobPostStatisticDto>({
      method: 'GET',
      url: `/api/app/job-post/${id}/job-post-statistic`,
    },
    { apiName: this.apiName,...config });
  

  postJob = (dto: PostJobDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-post/job',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  rejectJobPost = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/job-post/reject-job-post/${jobId}`,
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
