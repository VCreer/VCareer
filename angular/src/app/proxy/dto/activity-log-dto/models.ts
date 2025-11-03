import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { ActivityType } from '../../models/activity-logs/activity-type.enum';

export interface ActivityLogDto extends EntityDto<string> {
  userId?: string;
  activityType?: ActivityType;
  activityTypeName?: string;
  entityId?: string;
  entityType?: string;
  action?: string;
  description?: string;
  ipAddress?: string;
  creationTime?: string;
  metadata: Record<string, object>;
}

export interface ActivityLogFilterDto extends PagedAndSortedResultRequestDto {
  activityType?: ActivityType;
  startDate?: string;
  endDate?: string;
  searchKeyword?: string;
}

export interface ActivityLogListDto {
  staffInfo: StaffInfoDto;
  activities: ActivityLogDto[];
  statistics: ActivityStatisticsDto;
  totalCount: number;
}

export interface ActivityStatisticsDto {
  totalActivities: number;
  jobActivities: number;
  emailActivities: number;
  evaluationActivities: number;
  interviewActivities: number;
  todayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
}

export interface StaffInfoDto {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  surname?: string;
  fullName?: string;
  isLead: boolean;
  status: boolean;
}
