import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ActivityLogFilterDto, ActivityLogListDto, AllStaffActivityLogsListDto } from '../../../dto/activity-log-dto/models';
import type { ActivityType } from '../../../models/activity-logs/activity-type.enum';

@Injectable({
  providedIn: 'root',
})
export class ActivityLogService {
  apiName = 'Default';
  

  getStaffActivityLogs = (staffId: string, input: ActivityLogFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActivityLogListDto>({
      method: 'GET',
      url: `/api/app/activity-log/staff-activity-logs/${staffId}`,
      params: { activityType: input.activityType, startDate: input.startDate, endDate: input.endDate, searchKeyword: input.searchKeyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getMyActivityLogs = (input: ActivityLogFilterDto, config?: Partial<Rest.Config>) => {
    const params: any = {
      skipCount: input.skipCount,
      maxResultCount: input.maxResultCount
    };
    
    if (input.sorting) params.sorting = input.sorting;
    if (input.activityType !== undefined) params.activityType = input.activityType;
    if (input.startDate) params.startDate = input.startDate;
    if (input.endDate) params.endDate = input.endDate;
    if (input.searchKeyword) params.searchKeyword = input.searchKeyword;
    
    return this.restService.request<any, AllStaffActivityLogsListDto>({
      method: 'GET',
      url: '/api/app/activity-log/my-activity-logs',
      params: params,
    },
    { apiName: this.apiName,...config });
  };


  getAllStaffActivityLogs = (input: ActivityLogFilterDto, config?: Partial<Rest.Config>) => {
    const params: any = {
      skipCount: input.skipCount,
      maxResultCount: input.maxResultCount
    };
    
    if (input.sorting) params.sorting = input.sorting;
    if (input.activityType !== undefined) params.activityType = input.activityType;
    if (input.startDate) params.startDate = input.startDate;
    if (input.endDate) params.endDate = input.endDate;
    if (input.searchKeyword) params.searchKeyword = input.searchKeyword;
    
    return this.restService.request<any, AllStaffActivityLogsListDto>({
      method: 'GET',
      url: '/api/app/activity-log/all-staff-activity-logs',
      params: params,
    },
    { apiName: this.apiName,...config });
  };


  logActivity = (userId: string, activityType: ActivityType, action: string, description: string, entityId?: string, entityType?: string, metadata?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/activity-log/log-activity',
      params: { userId, activityType, action, description, entityId, entityType, metadata },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
