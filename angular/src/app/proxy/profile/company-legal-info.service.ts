import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CompanyInfoForJobDetailDto, CompanyLegalInfoDto, CompanySearchInputDto, CompanyVerificationFilterDto, CompanyVerificationViewDto, RejectCompanyDto, SubmitCompanyLegalInfoDto, UpdateCompanyLegalInfoDto, UploadLegalDocumentInputDto } from '../dto/profile/models';
import type { ActionResult, IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class CompanyLegalInfoService {
  apiName = 'Default';
  

  approveCompany = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: `/api/profile/company-legal-info/${id}/approve`,
    },
    { apiName: this.apiName,...config });
  

  deleteCompanyLegalInfo = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: `/api/profile/company-legal-info/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getCompanyByJobId = (jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyInfoForJobDetailDto>({
      method: 'GET',
      url: `/api/profile/company-legal-info/by-job/${jobId}`,
    },
    { apiName: this.apiName,...config });
  

  getCompanyLegalInfo = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'GET',
      url: `/api/profile/company-legal-info/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserCompanyLegalInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'GET',
      url: '/api/profile/company-legal-info/current-user',
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserCompanyLegalInfoList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto[]>({
      method: 'GET',
      url: '/api/profile/company-legal-info/current-user/list',
    },
    { apiName: this.apiName,...config });
  

  getLegalDocument = (storagePath: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: '/api/profile/company-legal-info/legal-document',
      params: { storagePath },
    },
    { apiName: this.apiName,...config });
  

  getPendingCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<CompanyVerificationViewDto>>>({
      method: 'POST',
      url: '/api/profile/company-legal-info/pending-companies',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getRejectedCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<CompanyVerificationViewDto>>>({
      method: 'POST',
      url: '/api/profile/company-legal-info/rejected-companies',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getVerifiedCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<CompanyVerificationViewDto>>>({
      method: 'POST',
      url: '/api/profile/company-legal-info/verified-companies',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  rejectCompany = (id: number, input: RejectCompanyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: `/api/profile/company-legal-info/${id}/reject`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  searchCompanies = (input: CompanySearchInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<CompanyLegalInfoDto>>>({
      method: 'POST',
      url: '/api/profile/company-legal-info/search',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  submitCompanyLegalInfo = (input: SubmitCompanyLegalInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'POST',
      url: '/api/profile/company-legal-info',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateCompanyLegalInfo = (id: number, input: UpdateCompanyLegalInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'PUT',
      url: `/api/profile/company-legal-info/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateFileUrls = (id: number, businessLicenseFile?: string, taxCertificateFile?: string, representativeIdCardFile?: string, otherSupportFile?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'PUT',
      url: `/api/profile/company-legal-info/${id}/files`,
      params: { businessLicenseFile, taxCertificateFile, representativeIdCardFile, otherSupportFile },
    },
    { apiName: this.apiName,...config });
  

  uploadLegalDocument = (id: number, input: UploadLegalDocumentInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyLegalInfoDto>({
      method: 'POST',
      url: `/api/profile/company-legal-info/${id}/upload-legal-document`,
      body: input.file,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
