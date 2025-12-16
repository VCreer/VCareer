import type { EntityDto, PagedResultDto } from '@abp/ng.core';
import type { NotificationDto } from './models';

export interface NotificationCreateDto {
  userId: string;
  userRole: string;
  notificationType: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: string;
  createdBy?: string;
}

export interface NotificationDto extends EntityDto<string> {
  userId?: string;
  userRole?: string;
  notificationType?: string;
  title?: string;
  message?: string;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: string;
  createdBy?: string;
  creationTime?: string;
}

export interface NotificationListDto extends PagedResultDto<NotificationDto> {
  unreadCount: number;
}

export interface PagingDto {
  pageIndex: number;
  pageSize: number;
}
