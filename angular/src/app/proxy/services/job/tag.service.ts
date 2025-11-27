import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { TagCreateDto, TagUpdateDto, TagViewDto } from '../../dto/category/models';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  apiName = 'Default';
  

  createTags = (dto: TagCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/tag/tags',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  deleteTags = (tagIds: number[], config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/tag/tags',
      params: { tagIds },
    },
    { apiName: this.apiName,...config });
  

  getTagsByCategoryId = (categoryId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TagViewDto[]>({
      method: 'GET',
      url: `/api/app/tag/tags-by-category-id/${categoryId}`,
    },
    { apiName: this.apiName,...config });
  

  updateTag = (tagUpdateDto: TagUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/tag/tag',
      body: tagUpdateDto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
