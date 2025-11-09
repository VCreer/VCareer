import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ProvinceDto } from '../../../../dto/job/models';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  apiName = 'Default';
  

  getAllProvinces = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ProvinceDto[]>({
      method: 'GET',
      url: '/api/app/location/provinces',
    },
    { apiName: this.apiName,...config });
  

  searchProvincesByName = (searchTerm: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ProvinceDto[]>({
      method: 'POST',
      url: '/api/app/location/search-provinces-by-name',
      params: { searchTerm },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
