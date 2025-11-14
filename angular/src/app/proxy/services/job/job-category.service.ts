import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CategoryUpdateCreateDto } from '../../dto/job-dto/models';
import type { CategoryTreeDto } from '../../dto/job/models';

@Injectable({
  providedIn: 'root',
})
export class JobCategoryService {
  apiName = 'Default';
  

  creaateCategory = (dto: CategoryUpdateCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/job-category/creaate-category',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  deleteCategory = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/job-category/${id}/category`,
    },
    { apiName: this.apiName,...config });
  

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
  

  updateCategory = (id: string, dto: CategoryUpdateCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: `/api/app/job-category/${id}/category`,
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
