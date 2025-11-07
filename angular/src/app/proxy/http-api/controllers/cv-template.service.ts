import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CreateCvTemplateDto, CvTemplateDto, GetCvTemplateListDto, RenderCvDto, UpdateCvTemplateDto } from '../../cv/models';
import type { ActionResult, IActionResult } from '../../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class CvTemplateService {
  apiName = 'Default';
  

  create = (input: CreateCvTemplateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CvTemplateDto>>({
      method: 'POST',
      url: '/api/cv/templates',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: `/api/cv/templates/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CvTemplateDto>>({
      method: 'GET',
      url: `/api/cv/templates/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getActiveTemplates = (input: GetCvTemplateListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'GET',
      url: '/api/cv/templates/active',
      params: { category: input.category, isActive: input.isActive, isFree: input.isFree, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetCvTemplateListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'GET',
      url: '/api/cv/templates',
      params: { category: input.category, isActive: input.isActive, isFree: input.isFree, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  previewTemplate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<RenderCvDto>>({
      method: 'GET',
      url: `/api/cv/templates/${id}/preview`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateCvTemplateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CvTemplateDto>>({
      method: 'PUT',
      url: `/api/cv/templates/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
