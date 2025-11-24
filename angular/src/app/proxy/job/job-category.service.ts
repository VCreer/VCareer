import { Rest, RestService } from "@abp/ng.core";
import { CategoryTreeDto } from "../dto/category";

export class JobCategoryService {
  apiName = 'Default';

  constructor(private restService: RestService) {}

  getCategoryTree(config?: Partial<Rest.Config>) {
    return this.restService.request<any, CategoryTreeDto[]>(
      {
        method: 'GET',
        url: '/api/job-categories/tree',
      },
      { apiName: this.apiName, ...config }
    );
  }

  searchCategories(keyword: string, config?: Partial<Rest.Config>) {
    return this.restService.request<any, CategoryTreeDto[]>(
      {
        method: 'POST',
        url: '/api/job-categories/search',
        params: { keyword },
      },
      { apiName: this.apiName, ...config }
    );
  }
}
