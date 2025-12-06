import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ChildServiceCreateDto, ChildServiceGetDto, ChildServiceUpdateDto, ChildServiceViewDto } from '../../dto/subcriptions/models';

@Injectable({
  providedIn: 'root',
})
export class ChildService_Service {
  apiName = 'Default';
  

  createChildService = (dto: ChildServiceCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/childservice-service/create-childservice',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  deleteChildService = (childServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/childservice-service/delete-childservice',
      params: { childServiceId },
    },
    { apiName: this.apiName,...config });
  

  getChildServices = (dto: ChildServiceGetDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildServiceViewDto[]>({
      method: 'POST',
      url: '/api/app/childservice-service/GetChildServices',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  stopAgentCHildService = (childServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/childservice-service/stop-agent-childservice',
      params: { childServiceId },
    },
    { apiName: this.apiName,...config });
  

  updateChildService = (dto: ChildServiceUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/childservice-service/update-childservice',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
