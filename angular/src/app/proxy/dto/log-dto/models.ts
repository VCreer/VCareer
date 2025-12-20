
export interface AuditLogActionDto {
  id?: string;
  serviceName?: string;
  methodName?: string;
  parameters?: string;
  executionTime?: string;
  executionDuration: number;
}

export interface AuditLogDto {
  id?: string;
  userId?: string;
  userName?: string;
  roleName?: string;
  httpStatusCode?: number;
  exception?: string;
  url?: string;
  httpMethod?: string;
  browserInfo?: string;
  executionTime?: string;
  executionDuration: number;
}

export interface AuditLogRequestDto {
  userId?: string;
  startDate?: string;
  endDate?: string;
}
