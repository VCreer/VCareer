import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ProvinceDto } from '../../dto/geo-dto/models';

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  apiName = 'Default';
  

  getProvinces = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ProvinceDto[]>({
      method: 'GET',
      url: '/api/app/geo/provinces',
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
