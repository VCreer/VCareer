import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { GetUploadedCvListDto, UpdateUploadedCvDto, UploadCvRequestDto, UploadedCvDto } from '../../application/contracts/cv/models';
import type { ActionResult, IActionResult } from '../../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class UploadedCvService {
  apiName = 'Default';
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'DELETE',
      url: `/api/cv/uploaded/${id}`,
    },
    { apiName: this.apiName,...config });
  

  downloadCv = (id: string, inline: boolean = true, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'GET',
      url: `/api/cv/uploaded/${id}/download`,
      params: { inline },
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<UploadedCvDto>>({
      method: 'GET',
      url: `/api/cv/uploaded/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetUploadedCvListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'GET',
      url: '/api/cv/uploaded',
      params: { candidateId: input.candidateId, isDefault: input.isDefault, isPublic: input.isPublic, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  setDefault = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any>>({
      method: 'POST',
      url: `/api/cv/uploaded/${id}/set-default`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateUploadedCvDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<UploadedCvDto>>({
      method: 'PUT',
      url: `/api/cv/uploaded/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  uploadCv = (input: UploadCvRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<UploadedCvDto>>({
      method: 'POST',
      url: '/api/cv/uploaded/upload',
      body: input.file,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
