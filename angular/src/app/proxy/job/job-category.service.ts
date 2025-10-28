import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CategoryTreeDto } from '../dto/job/models';
import type { ActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class JobCategoryService {
  apiName = 'Default';
  

  getCategoryTree = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any<CategoryTreeDto>>>({
      method: 'GET',
      url: '/api/job-categories/tree',
    },
    { apiName: this.apiName,...config });
  

  searchCategories = (keyword: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any<CategoryTreeDto>>>({
      method: 'GET',
      url: '/api/job-categories/search',
      params: { keyword },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
