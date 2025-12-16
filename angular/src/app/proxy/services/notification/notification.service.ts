import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { NotificationCreateDto, NotificationDto, NotificationListDto, PagingDto } from '../../dto/notification/models';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  apiName = 'Default';
  

  createNotification = (input: NotificationCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, NotificationDto>({
      method: 'POST',
      url: '/api/app/notification/notification',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteAllNotifications = (userId: string, userRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/notification/all-notifications/${userId}`,
      params: { userRole },
    },
    { apiName: this.apiName,...config });
  

  deleteNotification = (notificationId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/notification/notification/${notificationId}`,
    },
    { apiName: this.apiName,...config });
  

  getNotifications = (userId: string, userRole: string, pagingDto: PagingDto, notificationType?: string, isRead?: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, NotificationListDto>({
      method: 'GET',
      url: `/api/app/notification/notifications/${userId}`,
      params: { userRole, pageIndex: pagingDto.pageIndex, pageSize: pagingDto.pageSize, notificationType, isRead },
    },
    { apiName: this.apiName,...config });
  

  getUnreadCount = (userId: string, userRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: `/api/app/notification/unread-count/${userId}`,
      params: { userRole },
    },
    { apiName: this.apiName,...config });
  

  markAllAsRead = (userId: string, userRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/mark-all-as-read/${userId}`,
      params: { userRole },
    },
    { apiName: this.apiName,...config });
  

  markAsRead = (notificationId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/mark-as-read/${notificationId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
