import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CVDto, CreateCVOnlineDto, GetCVListDto, SetDefaultCVDto, SetPublicCVDto, UpdateCVDto, UploadCVDto } from '../cv/models';
import type { IFormFile } from '../microsoft/asp-net-core/http/models';
import type { IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class CVService {
  apiName = 'Default';
  

  createCVOnline = (input: CreateCVOnlineDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'POST',
      url: '/api/cv/online',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteCV = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: `/api/cv/${id}`,
    },
    { apiName: this.apiName,...config });
  

  exportCVToPDF = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: `/api/cv/${id}/export-pdf`,
    },
    { apiName: this.apiName,...config });
  

  getCV = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'GET',
      url: `/api/cv/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getCVList = (input: GetCVListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CVDto>>({
      method: 'GET',
      url: '/api/cv',
      params: { cvType: input.cvType, status: input.status, isPublic: input.isPublic, isDefault: input.isDefault, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getCVsByType = (cvType: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto[]>({
      method: 'GET',
      url: `/api/cv/by-type/${cvType}`,
    },
    { apiName: this.apiName,...config });
  

  getDefaultCV = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'GET',
      url: '/api/cv/default',
    },
    { apiName: this.apiName,...config });
  

  getPublicCVsByCandidate = (candidateId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto[]>({
      method: 'GET',
      url: `/api/cv/public/${candidateId}`,
    },
    { apiName: this.apiName,...config });
  

  setDefaultCV = (input: SetDefaultCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: '/api/cv/set-default',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  setPublicCV = (input: SetPublicCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: '/api/cv/set-public',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  simpleUploadCV = (file: IFormFile, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'POST',
      url: '/api/cv/simple-upload',
      body: file,
    },
    { apiName: this.apiName,...config });
  

  updateCV = (id: string, input: UpdateCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'PUT',
      url: `/api/cv/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  uploadCV = (input: UploadCVDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CVDto>({
      method: 'POST',
      url: '/api/cv/upload',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
