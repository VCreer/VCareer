import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ChildServiceViewDto, SubcriptionsViewDto, User_SubcirptionCreateDto, User_SubcirptionUpdateDto, User_SubcirptionViewDto } from '../../dto/subcriptions/models';
import type { PagingDto } from '../../iservices/common/models';

@Injectable({
  providedIn: 'root',
})
export class UserSubcriptionService {
  apiName = 'Default';
  

  buySubcriptionByDto = (dto: User_SubcirptionCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/user-subcription/buy-subcription',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  cancleUserSubcriptionBySubcriptionServiceId = (subcriptionServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/user-subcription/cancle-user-subcription/${subcriptionServiceId}`,
    },
    { apiName: this.apiName,...config });
  

  createUserSubcriptionByDto = (dto: User_SubcirptionCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, User_SubcirptionViewDto>({
      method: 'POST',
      url: '/api/app/user-subcription/user-subcription',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  getAllSubcriptionsByUserByUserIdAndStatusAndPagingDto = (userId: string, status: number, pagingDto: PagingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SubcriptionsViewDto[]>({
      method: 'GET',
      url: `/api/app/user-subcription/subcriptions-by-user/${userId}`,
      params: { status, pageSize: pagingDto.pageSize, pageIndex: pagingDto.pageIndex },
    },
    { apiName: this.apiName,...config });
  

  getJobChildServiceAllowForUser = (serviceAction: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildServiceViewDto[]>({
      method: 'GET',
      url: '/api/app/user-subcription/job-child-service-allow-for-user',
      params: { serviceAction },
    },
    { apiName: this.apiName,...config });
  

  getUserSubcriptionServiceByUserSubcriptionServiceId = (UserSubcriptionServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, User_SubcirptionViewDto>({
      method: 'GET',
      url: `/api/app/user-subcription/user-subcription-service/${UserSubcriptionServiceId}`,
    },
    { apiName: this.apiName,...config });
  

  subcriptionBoughtedAndActiveByUserIdAndSubcriptionServiceId = (UserId: string, SubcriptionServiceId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string[]>({
      method: 'POST',
      url: '/api/app/user-subcription/subcription-boughted-and-active',
      params: { userId: UserId, subcriptionServiceId: SubcriptionServiceId },
    },
    { apiName: this.apiName,...config });
  

  updateUserSubcriptionByDto = (dto: User_SubcirptionUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/user-subcription/user-subcription',
      body: dto,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
