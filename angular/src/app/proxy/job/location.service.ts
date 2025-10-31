import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ProvinceDto } from '../dto/job/models';
import type { ActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  apiName = 'Default';
  

  getAllProvinces = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any<ProvinceDto>>>({
      method: 'GET',
      url: '/api/locations/provinces',
    },
    { apiName: this.apiName,...config });
  

  searchProvincesByName = (searchTerm: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any<ProvinceDto>>>({
      method: 'GET',
      url: '/api/locations/provinces/search',
      params: { searchTerm },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
