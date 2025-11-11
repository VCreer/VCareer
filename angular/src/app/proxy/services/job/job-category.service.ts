import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CategoryTreeDto } from '../../dto/job/models';

@Injectable({
  providedIn: 'root',
})
export class JobCategoryService {
  apiName = 'Default';
  

  getCategoryTree = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CategoryTreeDto[]>({
      method: 'GET',
      url: '/api/app/job-category/category-tree',
    },
    { apiName: this.apiName,...config });
  

  searchCategories = (keyword: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CategoryTreeDto[]>({
      method: 'POST',
      url: '/api/app/job-category/search-categories',
      params: { keyword },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
