import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ProvinceDto } from '../../dto/geo-dto/models';

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  apiName = 'Default';
  

  getProvinceNameByCodeByProvinceCode = (provinceCode: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'GET',
      responseType: 'text',
      url: '/api/app/geo/province-name-by-code',
      params: { provinceCode },
    },
    { apiName: this.apiName,...config });
  

  getProvinces = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ProvinceDto[]>({
      method: 'GET',
      url: '/api/app/geo/provinces',
    },
    { apiName: this.apiName,...config });
  

  getWardNameByCodeByWardCodeAndProvinceCode = (wardCode: number, provinceCode: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'GET',
      responseType: 'text',
      url: '/api/app/geo/ward-name-by-code',
      params: { wardCode, provinceCode },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
