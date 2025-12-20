import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { AuditLogActionDto, AuditLogDto, AuditLogRequestDto } from '../../dto/log-dto/models';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  apiName = 'Default';
  

  geEmployeetAuditLogs = (dto: AuditLogRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AuditLogDto[]>({
      method: 'POST',
      url: '/api/app/log/ge-employeet-audit-logs',
      body: dto,
    },
    { apiName: this.apiName,...config });
  

  getAuditLogActions = (auditLogId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AuditLogActionDto[]>({
      method: 'GET',
      url: `/api/app/log/audit-log-actions/${auditLogId}`,
    },
    { apiName: this.apiName,...config });
  

  getRecruiterAuditLogs = (dto: AuditLogRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AuditLogDto[]>({
      method: 'GET',
      url: '/api/app/log/recruiter-audit-logs',
      params: { userId: dto.userId, startDate: dto.startDate, endDate: dto.endDate },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
