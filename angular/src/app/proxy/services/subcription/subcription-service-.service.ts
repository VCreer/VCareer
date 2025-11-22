import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { AddChildServicesDto, ChildServiceViewDto, SubcriptionPriceViewDto, SubcriptionsCreateDto, SubcriptionsUpdateDto, SubcriptionsViewDto } from '../../dto/subcriptions/models';
import type { PagingDto } from '../../iservices/common/models';

@Injectable({
  providedIn: 'root',
})
export class SubcriptionService_Service {
  apiName = 'Default';
  

  addChildService = (dto: AddChildServicesDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/subcription-service_/child-service',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  createSubCription = (dto: SubcriptionsCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/subcription-service_/sub-cription',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  deleteSubcription = (subcriptionId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/subcription-service_/subcription/${subcriptionId}`,
    },
    { apiName: this.apiName,...config });
  

  getChildServicesBySubcriptionIdAndIsActive = (subcriptionId: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildServiceViewDto[]>({
      method: 'GET',
      url: `/api/app/subcription-service_/child-services/${subcriptionId}`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  getChildServicesBySubcriptionIdAndIsActiveAndPagingDto = (subcriptionId: string, isActive: boolean, pagingDto: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildServiceViewDto[]>({
      method: 'GET',
      url: `/api/app/subcription-service_/child-services/${subcriptionId}`,
      params: { isActive, pageSize: pagingDto.pageSize, pageIndex: pagingDto.pageIndex },
    },
    { apiName: this.apiName,...config });
  

  getSubcriptionServiceBySubcriptionId = (subcriptionId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SubcriptionsViewDto>({
      method: 'GET',
      url: `/api/app/subcription-service_/subcription-service/${subcriptionId}`,
    },
    { apiName: this.apiName,...config });
  

  getSubcriptionsPriceBySubcriptionIdAndIsExpiredAndPagingDto = (subcriptionId: string, isExpired: boolean, pagingDto: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SubcriptionPriceViewDto[]>({
      method: 'GET',
      url: `/api/app/subcription-service_/subcriptions-price/${subcriptionId}`,
      params: { isExpired, pageSize: pagingDto.pageSize, pageIndex: pagingDto.pageIndex },
    },
    { apiName: this.apiName,...config });
  

  removeChildService = (dto: AddChildServicesDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/subcription-service_/child-service',
      params: { childServiceIds: dto.childServiceIds, subcriptionId: dto.subcriptionId },
    },
    { apiName: this.apiName,...config });
  

  updateSubcription = (dto: SubcriptionsUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/subcription-service_/subcription',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
