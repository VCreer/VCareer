import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  CompanyDashboardDto,
  StaffPerformanceDto,
  ActivityTrendDto,
  TopPerformerDto,
  DashboardFilterDto
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class RecruitmentDashboardService {
  private apiUrl = '/api/app/recruitment-dashboard';

  constructor(private http: HttpClient) {}

  /**
   * Get company dashboard
   */
  getCompanyDashboard(filter: DashboardFilterDto): Observable<CompanyDashboardDto> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter.staffId) {
      params = params.set('staffId', filter.staffId);
    }
    if (filter.includeInactive !== undefined) {
      params = params.set('includeInactive', filter.includeInactive.toString());
    }
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.descending !== undefined) {
      params = params.set('descending', filter.descending.toString());
    }

    return this.http.get<CompanyDashboardDto>(`${this.apiUrl}/company`, { params });
  }

  /**
   * Get staff performance
   */
  getStaffPerformance(staffId: string, filter: DashboardFilterDto): Observable<StaffPerformanceDto> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }

    return this.http.get<StaffPerformanceDto>(`${this.apiUrl}/staff/${staffId}`, { params });
  }

  /**
   * Get activity trend
   */
  getActivityTrend(filter: DashboardFilterDto): Observable<ActivityTrendDto> {
    let params = new HttpParams();
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }

    return this.http.get<ActivityTrendDto>(`${this.apiUrl}/trend`, { params });
  }

  /**
   * Get top performers
   */
  getTopPerformers(topCount: number, filter: DashboardFilterDto): Observable<TopPerformerDto[]> {
    let params = new HttpParams();
    params = params.set('topCount', topCount.toString());
    
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }

    return this.http.get<TopPerformerDto[]>(`${this.apiUrl}/top-performers`, { params });
  }

  /**
   * Compare staff performance
   */
  compareStaffPerformance(staffIds: string[], filter: DashboardFilterDto): Observable<StaffPerformanceDto[]> {
    return this.http.post<StaffPerformanceDto[]>(`${this.apiUrl}/compare`, {
      staffIds,
      filter
    });
  }
}





