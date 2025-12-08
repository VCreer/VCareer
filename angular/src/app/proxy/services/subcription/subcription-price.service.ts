import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { SubcriptionPriceCreateDto, SubcriptionPriceUpdateDto, SubcriptionPriceViewDto } from '../../dto/subcriptions/models';

@Injectable({
  providedIn: 'root',
})
export class SubcriptionPriceService {
  apiName = 'Default';
  

  createSubcriptionPriceByDto = (dto: SubcriptionPriceCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/subcription-price/subcription-price',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  deleteSubcriptionPrice = (subcriptionPriceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/subcription-price/subcription-price/${subcriptionPriceId}`,
    },
    { apiName: this.apiName,...config });
  

  getCurrentPriceOfSubcriptionBySubcriptionId = (subcriptionId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: `/api/app/subcription-price/current-price-of-subcription/${subcriptionId}`,
    },
    { apiName: this.apiName,...config });
  

  getSubcriptionPricesServiceBySubcriptionIdAndPageIndex = (subcriptionId: string, pageIndex: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SubcriptionPriceViewDto[]>({
      method: 'GET',
      url: `/api/app/subcription-price/subcription-prices-service/${subcriptionId}`,
      params: { pageIndex },
    },
    { apiName: this.apiName,...config });
  

  setStatusSubcriptionPrice = (subcriptionPriceId: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/subcription-price/set-status-subcription-price/${subcriptionPriceId}`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  updateSubcriptionPrice = (dto: SubcriptionPriceUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/subcription-price/subcription-price',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
