import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CandidateCvDto, CreateCandidateCvDto, GetCandidateCvListDto, RenderCvDto, UpdateCandidateCvDto } from '../../cv/models';

@Injectable({
  providedIn: 'root',
})
export class CandidateCvService {
  apiName = 'Default';
  

  create = (input: CreateCandidateCvDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CandidateCvDto>({
      method: 'POST',
      url: '/api/app/candidate-cv',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/candidate-cv/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CandidateCvDto>({
      method: 'GET',
      url: `/api/app/candidate-cv/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getDefaultCv = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CandidateCvDto>({
      method: 'GET',
      url: '/api/app/candidate-cv/default-cv',
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetCandidateCvListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CandidateCvDto>>({
      method: 'GET',
      url: '/api/app/candidate-cv',
      params: { templateId: input.templateId, isPublished: input.isPublished, isDefault: input.isDefault, isPublic: input.isPublic, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  incrementViewCount = (cvId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/candidate-cv/increment-view-count/${cvId}`,
    },
    { apiName: this.apiName,...config });
  

  publish = (cvId: string, isPublished: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/candidate-cv/publish/${cvId}`,
      params: { isPublished },
    },
    { apiName: this.apiName,...config });
  

  renderCv = (cvId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RenderCvDto>({
      method: 'POST',
      url: `/api/app/candidate-cv/render-cv/${cvId}`,
    },
    { apiName: this.apiName,...config });
  

  setDefault = (cvId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/candidate-cv/set-default/${cvId}`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateCandidateCvDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CandidateCvDto>({
      method: 'PUT',
      url: `/api/app/candidate-cv/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
