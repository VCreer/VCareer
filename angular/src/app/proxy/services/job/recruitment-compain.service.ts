import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { RecruimentCampainCreateDto, RecruimentCampainUpdateDto, RecruimentCampainViewDto } from '../../dto/job-dto/models';
import type { JobViewDetail } from '../../dto/job/models';

@Injectable({
  providedIn: 'root',
})
export class RecruitmentCompainService {
  apiName = 'Default';
  

  createRecruitmentCompainByInput = (input: RecruimentCampainCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/recruitment-compain/recruitment-compain',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getCompainByCompanyIdByCompanyIdAndIsActive = (companyId: number, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RecruimentCampainViewDto[]>({
      method: 'GET',
      url: `/api/app/recruitment-compain/compain-by-company-id/${companyId}`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  getCompainByIdByRecruimentId = (recruimentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RecruimentCampainViewDto>({
      method: 'GET',
      url: `/api/app/recruitment-compain/compain-by-id/${recruimentId}`,
    },
    { apiName: this.apiName,...config });
  

  getCompainsByRecruiterIdByRecruiterIdAndIsActive = (recruiterId: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RecruimentCampainViewDto[]>({
      method: 'GET',
      url: `/api/app/recruitment-compain/compains-by-recruiter-id/${recruiterId}`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  getJobsByCompainIdByCompainId = (compainId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, JobViewDetail[]>({
      method: 'GET',
      url: `/api/app/recruitment-compain/jobs-by-compain-id/${compainId}`,
    },
    { apiName: this.apiName,...config });
  

  loadRecruitmentCompainByIsActive = (isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RecruimentCampainViewDto[]>({
      method: 'POST',
      url: '/api/app/recruitment-compain/load-recruitment-compain',
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  setRecruitmentCompainStatusByCompainIdAndIsActive = (compainId: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/recruitment-compain/set-recruitment-compain-status/${compainId}`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  updateRecruitmentCompainByInput = (input: RecruimentCampainUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/recruitment-compain/recruitment-compain',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
