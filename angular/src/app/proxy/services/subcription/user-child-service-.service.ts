import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { SubcriptionContance_ChildServiceStatus } from '../../constants/job-constant/subcription-contance-child-service-status.enum';
import type { User_ChildServiceCreateDto, User_ChildServiceUpdateDto, User_ChildServiceViewDto } from '../../dto/subcriptions/models';
import type { PagingDto } from '../../iservices/common/models';

@Injectable({
  providedIn: 'root',
})
export class User_ChildService_Service {
  apiName = 'Default';
  

  activeService = (dto: User_ChildServiceCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/user_Child-service_/active-service',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  getAllChildServiceByUser = (userId: string, status: SubcriptionContance_ChildServiceStatus, pagingDto: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, User_ChildServiceViewDto[]>({
      method: 'GET',
      url: `/api/app/user_Child-service_/child-service-by-user/${userId}`,
      params: { status, pageSize: pagingDto.pageSize, pageIndex: pagingDto.pageIndex },
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
