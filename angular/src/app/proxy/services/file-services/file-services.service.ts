import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { FileChunkInput, FileChunkResult, FileDescriptorDto, UploadFileDto } from '../../dto/file-dto/models';

@Injectable({
  providedIn: 'root',
})
export class FileServicesService {
  apiName = 'Default';
  

  getMetadata = (storageName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FileDescriptorDto>({
      method: 'GET',
      url: '/api/app/file-services/metadata',
      params: { storageName },
    },
    { apiName: this.apiName,...config });
  

  hardDelete = (fileId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/file-services/hard-delete/${fileId}`,
    },
    { apiName: this.apiName,...config });
  

  softDelete = (fileId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/file-services/soft-delete/${fileId}`,
    },
    { apiName: this.apiName,...config });
  

  upload = (input: UploadFileDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/file-services/upload',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  uploadChunk = (input: FileChunkInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FileChunkResult>({
      method: 'POST',
      url: '/api/app/file-services/upload-chunk',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
