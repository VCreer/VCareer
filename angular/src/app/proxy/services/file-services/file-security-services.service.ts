import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { IdentityUser } from '../../microsoft/asp-net-core/identity/models';

@Injectable({
  providedIn: 'root',
})
export class FileSecurityServicesService {
  apiName = 'Default';
  

  checkUserQuota = (user: IdentityUser, newFileSize: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/file-security-services/check-user-quota',
      params: { newFileSize },
      body: user,
    },
    { apiName: this.apiName,...config });
  

  generateSafeStorageNameByFileName = (fileName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'POST',
      responseType: 'text',
      url: '/api/app/file-security-services/generate-safe-storage-name',
      params: { fileName },
    },
    { apiName: this.apiName,...config });
  

  getMimeTypeByExtension = (extension: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'GET',
      responseType: 'text',
      url: '/api/app/file-security-services/mime-type',
      params: { extension },
    },
    { apiName: this.apiName,...config });
  

  scanVirus = (fileStream: any, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/file-security-services/scan-virus',
      body: fileStream,
    },
    { apiName: this.apiName,...config });
  

  validateExtensionByFileNameAndContainerType = (fileName: string, containerType: object, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/file-security-services/validate-extension',
      params: { fileName },
      body: containerType,
    },
    { apiName: this.apiName,...config });
  

  validateMimeAndMagic = (fileStream: any, containerType: object, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/file-security-services/validate-mime-and-magic',
      body: containerType,
    },
    { apiName: this.apiName,...config });
  

  validateSizeBySizeAndContainerType = (size: number, containerType: object, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/file-security-services/validate-size',
      params: { size },
      body: containerType,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
