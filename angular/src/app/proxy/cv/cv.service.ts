import type { CVDto, CreateCVOnlineDto, GetCVListDto, SetDefaultCVDto, SetPublicCVDto, UpdateCVDto, UploadCVDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CVService {
  apiName = 'Default';
  

  createCVOnline = (input: CreateCVOnlineDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'POST',
      url: '/api/app/c-v/c-vOnline',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteCV = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/c-v/${id}/c-v`,
    },
    { apiName: this.apiName,...config });
  

  getCV = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'GET',
      url: `/api/app/c-v/${id}/c-v`,
    },
    { apiName: this.apiName,...config });
  

  getCVList = (input: GetCVListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CVDto>>({
      method: 'GET',
      url: '/api/app/c-v/c-vList',
      params: { cvType: input.cvType, status: input.status, isPublic: input.isPublic, isDefault: input.isDefault, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getDefaultCV = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'GET',
      url: '/api/app/c-v/default-cV',
    },
    { apiName: this.apiName,...config });
  

  getPublicCVsByCandidate = (candidateId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto[]>({
      method: 'GET',
      url: `/api/app/c-v/public-cVs-by-candidate/${candidateId}`,
    },
    { apiName: this.apiName,...config });
  

  setDefaultCV = (input: SetDefaultCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/c-v/set-default-cV',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  setPublicCV = (input: SetPublicCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/c-v/set-public-cV',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateCV = (id: string, input: UpdateCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'PUT',
      url: `/api/app/c-v/${id}/c-v`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  uploadCV = (input: UploadCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'POST',
      url: '/api/app/c-v/upload-cV',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
