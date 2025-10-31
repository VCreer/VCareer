import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ActivateStaffDto, DeactivateStaffDto, StaffListItemDto, StaffStatusChangeDto } from '../../dto/team-management-dto/models';

@Injectable({
  providedIn: 'root',
})
export class TeamManagementService {
  apiName = 'Default';
  

  activateStaff = (input: ActivateStaffDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StaffStatusChangeDto>({
      method: 'POST',
      url: '/api/app/team-management/activate-staff',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deactivateStaff = (input: DeactivateStaffDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StaffStatusChangeDto>({
      method: 'POST',
      url: '/api/app/team-management/deactivate-staff',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getAllStaff = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StaffListItemDto[]>({
      method: 'GET',
      url: '/api/app/team-management/staff',
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StaffListItemDto>({
      method: 'GET',
      url: '/api/app/team-management/current-user-info',
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
