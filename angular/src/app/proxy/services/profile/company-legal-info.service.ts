import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CompanyInfoForJobDetailDto, CompanyLegalInfoDto, CompanySearchInputDto, CompanyVerificationViewDto, CompanyVerificationFilterDto, RejectCompanyDto, SubmitCompanyLegalInfoDto, UpdateCompanyLegalInfoDto } from '../../dto/profile/models';

@Injectable({
  providedIn: 'root',
})
export class CompanyLegalInfoService {
  apiName = 'Default';
  

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

  getPendingCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CompanyVerificationViewDto>>({
      method: 'POST',
      url: '/api/profile/company-legal-info/pending-companies',
      body: input,
    },
    { apiName: this.apiName,...config });

  approveCompany = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/profile/company-legal-info/${id}/approve`,
    },
    { apiName: this.apiName,...config });

  rejectCompany = (id: number, input: RejectCompanyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/profile/company-legal-info/${id}/reject`,
      body: input,
    },
    { apiName: this.apiName,...config });

  getVerifiedCompanies = (input: CompanyVerificationFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CompanyVerificationViewDto>>({
      method: 'POST',
      url: '/api/profile/company-legal-info/verified-companies',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
