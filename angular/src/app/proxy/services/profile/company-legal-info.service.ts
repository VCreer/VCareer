import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { FileStreamResultDto } from '../../dto/file-dto/models';
import type { CompanyInfoForJobDetailDto, CompanyLegalInfoDto, CompanySearchInputDto, CompanyVerificationFilterDto, CompanyVerificationViewDto, RejectCompanyDto, SubmitCompanyLegalInfoDto, UpdateCompanyLegalInfoDto } from '../../dto/profile/models';
import type { IFormFile } from '../../microsoft/asp-net-core/http/models';

@Injectable({
  providedIn: 'root',
})
export class CompanyLegalInfoService {
  apiName = 'Default';
  

  approveCompany = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/company-legal-info/${id}/approve-company`,
    },
    { apiName: this.apiName,...config });
  

  deleteCompanyLegalInfo = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/company-legal-info/${id}/company-legal-info`,
    },
    { apiName: this.apiName,...config });
  

  getCompanyByJobId = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyInfoForJobDetailDto>({
      method: 'GET',
      url: `/api/app/company-legal-info/company-by-job-id/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  getCompanyLegalInfo = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'GET',
      url: `/api/app/company-legal-info/${id}/company-legal-info`,
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserCompanyLegalInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'GET',
      url: '/api/app/company-legal-info/current-user-company-legal-info',
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserCompanyLegalInfoList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto[]>({
      method: 'GET',
      url: '/api/app/company-legal-info/current-user-company-legal-info-list',
    },
    { apiName: this.apiName,...config });
  

  getLegalDocumentFile = (storagePath: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FileStreamResultDto>({
      method: 'GET',
      url: '/api/app/company-legal-info/legal-document-file',
      params: { storagePath },
    },
    { apiName: this.apiName,...config });
  

  getPendingCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CompanyVerificationViewDto>>({
      method: 'GET',
      url: '/api/app/company-legal-info/pending-companies',
      params: { keyword: input.keyword, createdFrom: input.createdFrom, createdTo: input.createdTo, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getRejectedCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CompanyVerificationViewDto>>({
      method: 'GET',
      url: '/api/app/company-legal-info/rejected-companies',
      params: { keyword: input.keyword, createdFrom: input.createdFrom, createdTo: input.createdTo, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getVerifiedCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CompanyVerificationViewDto>>({
      method: 'GET',
      url: '/api/app/company-legal-info/verified-companies',
      params: { keyword: input.keyword, createdFrom: input.createdFrom, createdTo: input.createdTo, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  rejectCompany = (id: number, input: RejectCompanyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/company-legal-info/${id}/reject-company`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  searchCompanies = (input: CompanySearchInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CompanyLegalInfoDto>>({
      method: 'POST',
      url: '/api/app/company-legal-info/search-companies',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  submitCompanyLegalInfo = (input: SubmitCompanyLegalInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'POST',
      url: '/api/app/company-legal-info/submit-company-legal-info',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateCompanyLegalInfo = (id: number, input: UpdateCompanyLegalInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'PUT',
      url: `/api/app/company-legal-info/${id}/company-legal-info`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateFileUrls = (id: number, businessLicenseFile?: string, taxCertificateFile?: string, representativeIdCardFile?: string, otherSupportFile?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'PUT',
      url: `/api/app/company-legal-info/${id}/file-urls`,
      params: { businessLicenseFile, taxCertificateFile, representativeIdCardFile, otherSupportFile },
    },
    { apiName: this.apiName,...config });
  

  uploadLegalDocument = (id: number, file: IFormFile, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'POST',
      url: `/api/app/company-legal-info/${id}/upload-legal-document`,
      body: file,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
