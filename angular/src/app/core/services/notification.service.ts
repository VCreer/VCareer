import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
  
  // BehaviorSubject để share unread count giữa các components
  private unreadCountSubject = new BehaviorSubject<{ [key: string]: number }>({});
  public unreadCount$ = this.unreadCountSubject.asObservable();

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
    
    return this.http.get<NotificationListDto>(this.apiUrl, { 
      params,
      withCredentials: true // Đảm bảo gửi cookies để authenticate
    });
  }

  getUnreadCount(userRole: string): Observable<number> {
    const params = new HttpParams().set('userRole', userRole);
    return this.http.get<number>(`${this.apiUrl}/unread-count`, { 
      params,
      withCredentials: true // Đảm bảo gửi cookies để authenticate
    }).pipe(
      tap(count => {
        // Cập nhật unread count vào BehaviorSubject
        const currentCounts = this.unreadCountSubject.value;
        this.unreadCountSubject.next({ ...currentCounts, [userRole]: count });
      })
    );
  }

  // Method để cập nhật unread count từ bên ngoài
  updateUnreadCount(userRole: string, count: number): void {
    const currentCounts = this.unreadCountSubject.value;
    this.unreadCountSubject.next({ ...currentCounts, [userRole]: count });
  }

  // Method để lấy unread count hiện tại
  getCurrentUnreadCount(userRole: string): number {
    return this.unreadCountSubject.value[userRole] || 0;
  }

  markAsRead(notificationId: string, userRole?: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Nếu có userRole, giảm unread count đi 1
        if (userRole) {
          const currentCount = this.getCurrentUnreadCount(userRole);
          if (currentCount > 0) {
            this.updateUnreadCount(userRole, currentCount - 1);
          }
        }
      })
    );
  }

  markAllAsRead(userRole: string): Observable<void> {
    const params = new HttpParams().set('userRole', userRole);
    return this.http.put<void>(`${this.apiUrl}/mark-all-read`, {}, { params }).pipe(
      tap(() => {
        // Cập nhật unread count về 0 sau khi mark all as read
        this.updateUnreadCount(userRole, 0);
      })
    );
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  deleteAllNotifications(userRole: string): Observable<void> {
    const params = new HttpParams().set('userRole', userRole);
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
    return this.http.post<NotificationDto>(this.apiUrl, notification, {
      withCredentials: true
    });
  }
}

