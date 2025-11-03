import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { FileChunkInput, FileChunkResult, FileDescriptorDto, UploadFileDto } from '../../dto/file-dto/models';

@Injectable({
  providedIn: 'root',
})
export class FileServicesService {
  apiName = 'Default';
  

  delete = (storageName: string, userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/file-services',
      params: { storageName, userId },
    },
    { apiName: this.apiName,...config });
  

  download = (storageName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FileDescriptorDto>({
      method: 'POST',
      url: '/api/app/file-services/download',
      params: { storageName },
    },
    { apiName: this.apiName,...config });
  

  getMetadata = (storageName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FileDescriptorDto>({
      method: 'GET',
      url: '/api/app/file-services/metadata',
      params: { storageName },
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
