import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { EffectingJobServiceCreateDto, EffectingJobServiceUpdateDto, EffectingJobServiceViewDto } from '../../dto/subcriptions/models';
import type { PagingDto } from '../../iservices/common/models';

@Injectable({
  providedIn: 'root',
})
export class JobAffectingService {
  apiName = 'Default';
  

  applyServiceToJobByJobAffectingDto = (jobAffectingDto: EffectingJobServiceCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-affecting/apply-service-to-job',
      body: jobAffectingDto,
    },
    { apiName: this.apiName,...config });
  

  cancleEffectingJobServiceByJobAffectingDto = (jobAffectingDto: EffectingJobServiceUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-affecting/cancle-effecting-job-service',
      body: jobAffectingDto,
    },
    { apiName: this.apiName,...config });
  

  getEffectingJobServiceByEffectingJobServiceId = (effectingJobServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EffectingJobServiceViewDto>({
      method: 'GET',
      url: `/api/app/job-affecting/effecting-job-service/${effectingJobServiceId}`,
    },
    { apiName: this.apiName,...config });
  

  getEffectingJobServicesByJobIdAndStatus = (JobId: string, status: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EffectingJobServiceViewDto[]>({
      method: 'GET',
      url: `/api/app/job-affecting/effecting-job-services/${JobId}`,
      params: { status },
    },
    { apiName: this.apiName,...config });
  

  getEffectingJobServicesWithPagingByJobIdAndStatusAndPagingDto = (jobId: string, status: number, pagingDto: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EffectingJobServiceViewDto[]>({
      method: 'GET',
      url: `/api/app/job-affecting/effecting-job-services-with-paging/${jobId}`,
      params: { status, pageSize: pagingDto.pageSize, pageIndex: pagingDto.pageIndex },
    },
    { apiName: this.apiName,...config });
  

  updateEffectingJobServiceByJobAffectingDto = (jobAffectingDto: EffectingJobServiceUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/job-affecting/effecting-job-service',
      body: jobAffectingDto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
