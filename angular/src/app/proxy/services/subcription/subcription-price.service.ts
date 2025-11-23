import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { SubcriptionPriceViewDto, SubcriptionsCreateDto, SubcriptionsUpdateDto } from '../../dto/subcriptions/models';
import type { PagingDto } from '../../iservices/common/models';

@Injectable({
  providedIn: 'root',
})
export class SubcriptionPriceService {
  apiName = 'Default';
  

  createSubcriptionPriceByCreateSubCriptionDto = (createSubCriptionDto: SubcriptionsCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/subcription-price/subcription-price',
      body: createSubCriptionDto,
    },
    { apiName: this.apiName,...config });
  

  deleteSoftSubcriptionPrice = (createSubCriptionDto: SubcriptionsUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/subcription-price/soft-subcription-price',
      params: { subcriptionId: createSubCriptionDto.subcriptionId, title: createSubCriptionDto.title, description: createSubCriptionDto.description, isActive: createSubCriptionDto.isActive, dayDuration: createSubCriptionDto.dayDuration },
    },
    { apiName: this.apiName,...config });
  

  getSubcriptionPriceServiceBySubcriptionPriceIdAndPagingDto = (subcriptionPriceId: string, pagingDto: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SubcriptionPriceViewDto>({
      method: 'GET',
      url: `/api/app/subcription-price/subcription-price-service/${subcriptionPriceId}`,
      params: { pageSize: pagingDto.pageSize, pageIndex: pagingDto.pageIndex },
    },
    { apiName: this.apiName,...config });
  

  updateSubcriptionPrice = (createSubCriptionDto: SubcriptionsUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/subcription-price/subcription-price',
      body: createSubCriptionDto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
