import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ChildServiceCreateDto, ChildServiceUpdateDto, ChildServiceViewDto } from '../../dto/subcriptions/models';
import type { PagingDto } from '../../iservices/common/models';

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
  

  getChildServices = (serviceAction: string, target: string, paging: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildServiceViewDto[]>({
      method: 'POST',
      url: '/api/app/childservice-service/GetChildServices',
      params: { serviceAction, target },
      body: paging,
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
