import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ActivityLogFilterDto, ActivityLogListDto, AllStaffActivityLogsListDto } from '../../dto/activity-log-dto/models';

@Injectable({
  providedIn: 'root',
})
export class ActivityLogService {
  apiName = 'Default';
  

  getAllStaffActivityLogs = (input: ActivityLogFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AllStaffActivityLogsListDto>({
      method: 'GET',
      url: '/api/app/activity-log/all-staff-activity-logs',
      params: { activityType: input.activityType, startDate: input.startDate, endDate: input.endDate, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getMyActivityLogs = (input: ActivityLogFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AllStaffActivityLogsListDto>({
      method: 'GET',
      url: '/api/app/activity-log/my-activity-logs',
      params: { activityType: input.activityType, startDate: input.startDate, endDate: input.endDate, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getStaffActivityLogs = (staffId: string, input: ActivityLogFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActivityLogListDto>({
      method: 'GET',
      url: `/api/app/activity-log/staff-activity-logs/${staffId}`,
      params: { activityType: input.activityType, startDate: input.startDate, endDate: input.endDate, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
