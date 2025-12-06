import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CandidateCvDto, CreateCandidateCvDto, GetCandidateCvListDto, RenderCvDto, UpdateCandidateCvDto } from '../../cv/models';
import type { ActionResult, IActionResult } from '../../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class CandidateCvService {
  apiName = 'Default';
  

  create = (input: CreateCandidateCvDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CandidateCvDto>>({
      method: 'POST',
      url: '/api/cv/candidates',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: `/api/cv/candidates/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CandidateCvDto>>({
      method: 'GET',
      url: `/api/cv/candidates/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getDefaultCv = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CandidateCvDto>>({
      method: 'GET',
      url: '/api/cv/candidates/default',
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetCandidateCvListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'GET',
      url: '/api/cv/candidates',
      params: { templateId: input.templateId, isPublished: input.isPublished, isDefault: input.isDefault, isPublic: input.isPublic, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  incrementViewCount = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: `/api/cv/candidates/${id}/increment-view`,
    },
    { apiName: this.apiName,...config });
  

  publish = (id: string, isPublished: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: `/api/cv/candidates/${id}/publish`,
      body: isPublished,
    },
    { apiName: this.apiName,...config });
  

  renderCv = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<RenderCvDto>>({
      method: 'GET',
      url: `/api/cv/candidates/${id}/render`,
    },
    { apiName: this.apiName,...config });
  

  setDefault = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: `/api/cv/candidates/${id}/set-default`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateCandidateCvDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CandidateCvDto>>({
      method: 'PUT',
      url: `/api/cv/candidates/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updatePreviewImage = (id: string, previewImageUrl: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: `/api/cv/candidates/${id}/preview-image`,
      body: { previewImageUrl: previewImageUrl },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
