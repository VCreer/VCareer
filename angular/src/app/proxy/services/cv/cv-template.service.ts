import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CreateCvTemplateDto, CvTemplateDto, GetCvTemplateListDto, RenderCvDto, UpdateCvTemplateDto } from '../../cv/models';

@Injectable({
  providedIn: 'root',
})
export class CvTemplateService {
  apiName = 'Default';
  

  create = (input: CreateCvTemplateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CvTemplateDto>({
      method: 'POST',
      url: '/api/app/cv-template',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/cv-template/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CvTemplateDto>({
      method: 'GET',
      url: `/api/app/cv-template/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getActiveTemplates = (input: GetCvTemplateListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CvTemplateDto>>({
      method: 'GET',
      url: '/api/app/cv-template/active-templates',
      params: { category: input.category, isActive: input.isActive, isFree: input.isFree, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetCvTemplateListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CvTemplateDto>>({
      method: 'GET',
      url: '/api/app/cv-template',
      params: { category: input.category, isActive: input.isActive, isFree: input.isFree, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  previewTemplate = (templateId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RenderCvDto>({
      method: 'POST',
      url: `/api/app/cv-template/preview-template/${templateId}`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateCvTemplateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CvTemplateDto>({
      method: 'PUT',
      url: `/api/app/cv-template/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
