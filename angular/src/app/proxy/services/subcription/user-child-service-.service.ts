import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { User_ChildServiceUpdateDto, User_ChildServiceViewDto } from '../../dto/subcriptions/models';

@Injectable({
  providedIn: 'root',
})
export class User_ChildService_Service {
  apiName = 'Default';
  

  activeService = (childServiceIds: string[], jobId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/user_Child-service_/active-service/${jobId}`,
      body: childServiceIds,
    },
    { apiName: this.apiName,...config });
  

  getUser_ChildService = (userChildServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, User_ChildServiceViewDto>({
      method: 'GET',
      url: `/api/app/user_Child-service_/user_Child-service/${userChildServiceId}`,
    },
    { apiName: this.apiName,...config });
  

  updateUser_ChildService = (dto: User_ChildServiceUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/user_Child-service_/user_Child-service',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
