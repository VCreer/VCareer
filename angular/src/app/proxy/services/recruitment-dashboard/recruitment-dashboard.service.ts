import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ActivityTrendDto, CompanyDashboardDto, DashboardFilterDto, StaffPerformanceDto, TopPerformerDto } from '../../dto/dashboard-dto/models';

@Injectable({
  providedIn: 'root',
})
export class RecruitmentDashboardService {
  apiName = 'Default';
  

  compareStaffPerformance = (staffIds: string[], filter: DashboardFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StaffPerformanceDto[]>({
      method: 'POST',
      url: '/api/app/recruitment-dashboard/compare-staff-performance',
      body: filter,
    },
    { apiName: this.apiName,...config });
  

  getActivityTrend = (filter: DashboardFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActivityTrendDto>({
      method: 'GET',
      url: '/api/app/recruitment-dashboard/activity-trend',
      params: { startDate: filter.startDate, endDate: filter.endDate, staffId: filter.staffId, includeInactive: filter.includeInactive, sortBy: filter.sortBy, descending: filter.descending },
    },
    { apiName: this.apiName,...config });
  

  getCompanyDashboard = (filter: DashboardFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CompanyDashboardDto>({
      method: 'GET',
      url: '/api/app/recruitment-dashboard/company-dashboard',
      params: { startDate: filter.startDate, endDate: filter.endDate, staffId: filter.staffId, includeInactive: filter.includeInactive, sortBy: filter.sortBy, descending: filter.descending },
    },
    { apiName: this.apiName,...config });
  

  getStaffPerformance = (staffId: string, filter: DashboardFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StaffPerformanceDto>({
      method: 'GET',
      url: `/api/app/recruitment-dashboard/staff-performance/${filter.staffId}`,
      params: { staffId, startDate: filter.startDate, endDate: filter.endDate, includeInactive: filter.includeInactive, sortBy: filter.sortBy, descending: filter.descending },
    },
    { apiName: this.apiName,...config });
  

  getTopPerformers = (topCount: number, filter: DashboardFilterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TopPerformerDto[]>({
      method: 'GET',
      url: '/api/app/recruitment-dashboard/top-performers',
      params: { topCount, startDate: filter.startDate, endDate: filter.endDate, staffId: filter.staffId, includeInactive: filter.includeInactive, sortBy: filter.sortBy, descending: filter.descending },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
