import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileSecurityServicesService {
  apiName = 'Default';
  

  checkUserQuota = (userId: string, newFileSize: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: `/api/app/file-security-services/check-user-quota/${userId}`,
      params: { newFileSize },
    },
    { apiName: this.apiName,...config });
  

  generateSafeStorageNameByUserIdAndFileName = (userId: string, fileName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'POST',
      responseType: 'text',
      url: `/api/app/file-security-services/generate-safe-storage-name/${userId}`,
      params: { fileName },
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
  

  validateMimeAndMagic = (fileStream: any, fileName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/file-security-services/validate-mime-and-magic',
      params: { fileName },
      body: fileStream,
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
