import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationDto {
  id: string;
  userId: string;
  userRole: string;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: string;
  createdBy?: string;
  creationTime: string;
  expiresAt?: string; // optional expiration timestamp for the notification/job
}

export interface NotificationListDto {
  items: NotificationDto[];
  totalCount: number;
  unreadCount: number;
}

export interface PagingDto {
  pageIndex: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apis.default.url}/api/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(
    userRole: string,
    pageIndex: number = 0,
    pageSize: number = 10,
    notificationType?: string,
    isRead?: boolean
  ): Observable<NotificationListDto> {
    let params = new HttpParams()
      .set('userRole', userRole)
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    if (notificationType) {
      params = params.set('notificationType', notificationType);
    }
    if (isRead !== undefined) {
      params = params.set('isRead', isRead.toString());
    }

    console.log('[NotificationService] Calling API:', this.apiUrl);
    console.log('[NotificationService] Params:', params.toString());
    
    return this.http.get<NotificationListDto>(this.apiUrl, { 
      params,
      withCredentials: true // Đảm bảo gửi cookies để authenticate
    });
  }

  getUnreadCount(userRole: string): Observable<number> {
    const params = new HttpParams().set('userRole', userRole);
    console.log('[NotificationService] Calling unread count API:', `${this.apiUrl}/unread-count`);
    console.log('[NotificationService] Params:', params.toString());
    return this.http.get<number>(`${this.apiUrl}/unread-count`, { 
      params,
      withCredentials: true // Đảm bảo gửi cookies để authenticate
    });
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(userRole: string): Observable<void> {
    const params = new HttpParams().set('userRole', userRole);
    return this.http.put<void>(`${this.apiUrl}/mark-all-read`, {}, { params });
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  deleteAllNotifications(userRole: string): Observable<void> {
    const params = new HttpParams().set('userRole', userRole);
    console.log('[NotificationService] Deleting all notifications for role:', userRole);
    console.log('[NotificationService] API URL:', `${this.apiUrl}/all`);
    return this.http.delete<void>(`${this.apiUrl}/all`, { 
      params,
      withCredentials: true
    });
  }

  createNotification(notification: {
    userId: string;
    userRole: string;
    notificationType: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: string;
  }): Observable<NotificationDto> {
    console.log('[NotificationService] Creating notification:', notification);
    console.log('[NotificationService] API URL:', this.apiUrl);
    
    return this.http.post<NotificationDto>(this.apiUrl, notification, {
      withCredentials: true
    });
  }
}

