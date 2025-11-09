import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { GetUploadedCvListDto, UpdateUploadedCvDto, UploadedCvDto } from '../../application/contracts/cv/models';
import type { IFormFile } from '../../microsoft/asp-net-core/http/models';

@Injectable({
  providedIn: 'root',
})
export class UploadedCvService {
  apiName = 'Default';
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/uploaded-cv/${id}`,
    },
    { apiName: this.apiName,...config });
  

  downloadCv = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number[]>({
      method: 'POST',
      url: `/api/app/uploaded-cv/${id}/download-cv`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UploadedCvDto>({
      method: 'GET',
      url: `/api/app/uploaded-cv/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetUploadedCvListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<UploadedCvDto>>({
      method: 'GET',
      url: '/api/app/uploaded-cv',
      params: { candidateId: input.candidateId, isDefault: input.isDefault, isPublic: input.isPublic, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  setDefault = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/uploaded-cv/${id}/set-default`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateUploadedCvDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UploadedCvDto>({
      method: 'PUT',
      url: `/api/app/uploaded-cv/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  uploadCv = (file: IFormFile, cvName: string, isDefault?: boolean, isPublic?: boolean, notes?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UploadedCvDto>({
      method: 'POST',
      url: '/api/app/uploaded-cv/upload-cv',
      params: { cvName, isDefault, isPublic, notes },
      body: file,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
