import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastNotificationService {
  private notificationsSubject = new BehaviorSubject<ToastNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hiển thị thông báo thành công
   */
  success(message: string, duration: number = 3000): void {
    this.show({
      id: this.generateId(),
      message,
      type: 'success',
      duration
    });
  }

  /**
   * Hiển thị thông báo lỗi
   */
  error(message: string, duration: number = 5000): void {
    this.show({
      id: this.generateId(),
      message,
      type: 'error',
      duration
    });
  }

  /**
   * Hiển thị thông báo cảnh báo
   */
  warning(message: string, duration: number = 5000): void {
    this.show({
      id: this.generateId(),
      message,
      type: 'warning',
      duration
    });
  }

  /**
   * Hiển thị thông báo thông tin
   */
  info(message: string, duration: number = 3000): void {
    this.show({
      id: this.generateId(),
      message,
      type: 'info',
      duration
    });
  }

  /**
   * Hiển thị thông báo tùy chỉnh
   */
  show(notification: ToastNotification): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Tự động xóa sau khi hết thời gian
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Xóa thông báo
   */
  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter(n => n.id !== id)
    );
  }

  /**
   * Xóa tất cả thông báo
   */
  clear(): void {
    this.notificationsSubject.next([]);
  }
}

