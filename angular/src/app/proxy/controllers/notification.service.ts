import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { NotificationCreateDto, NotificationDto, NotificationListDto } from '../dto/notification/models';
import type { ActionResult, IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  apiName = 'Default';
  

  createNotification = (input: NotificationCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<NotificationDto>>({
      method: 'POST',
      url: '/api/notifications',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteAllNotifications = (userRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: '/api/notifications/all',
      params: { userRole },
    },
    { apiName: this.apiName,...config });
  

  deleteNotification = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: `/api/notifications/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getNotifications = (userRole: string, pageIndex?: number, pageSize: number = 10, notificationType?: string, isRead?: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<NotificationListDto>>({
      method: 'GET',
      url: '/api/notifications',
      params: { userRole, pageIndex, pageSize, notificationType, isRead },
    },
    { apiName: this.apiName,...config });
  

  getUnreadCount = (userRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<number>>({
      method: 'GET',
      url: '/api/notifications/unread-count',
      params: { userRole },
    },
    { apiName: this.apiName,...config });
  

  markAllAsRead = (userRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: '/api/notifications/mark-all-read',
      params: { userRole },
    },
    { apiName: this.apiName,...config });
  

  markAsRead = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: `/api/notifications/${id}/read`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
