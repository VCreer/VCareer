import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationDto } from '../../../../core/services/notification.service';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-recruiter-notifications',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent, ButtonComponent, PaginationComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class RecruiterNotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationDto[] = [];
  isLoading = false;
  totalCount = 0;
  unreadCount = 0;
  currentPage = 0;
  pageSize = 5;
  totalPages = 0;

  filterStatus: 'all' | 'read' | 'unread' = 'all';
  filterType: 'all' | 'candidate' | 'system' = 'all';

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Responsive & sidebar
  sidebarExpanded = false;
  sidebarWidth = 72;
  private sidebarCheckInterval?: any;
  private resizeListener?: () => void;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();

    // Theo dõi trạng thái sidebar để tránh đè nội dung
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Lắng nghe thay đổi kích thước cửa sổ
    this.resizeListener = () => {
      this.checkSidebarState();
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  loadNotifications() {
    this.isLoading = true;

    let isReadFilter: boolean | undefined = undefined;
    if (this.filterStatus === 'read') {
      isReadFilter = true;
    } else if (this.filterStatus === 'unread') {
      isReadFilter = false;
    }

    let notificationTypeFilter: string | undefined = undefined;
    if (this.filterType === 'candidate') {
      notificationTypeFilter = 'ApplicationSubmitted';
    } else if (this.filterType === 'system') {
      notificationTypeFilter = 'System';
    }

    this.notificationService
      .getNotifications('Recruiter', this.currentPage, this.pageSize, notificationTypeFilter, isReadFilter)
      .pipe(
        catchError(error => {
          console.error('[Recruiter Notifications] Error loading notifications:', error);
          this.showToastMessage('Không thể tải thông báo', 'error');
          this.isLoading = false;
          return of({ items: [], totalCount: 0, unreadCount: 0 } as any);
        })
      )
      .subscribe(result => {
        this.notifications = result.items || [];
        this.totalCount = result.totalCount || 0;
        this.unreadCount = result.unreadCount || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.isLoading = false;
      });
  }

  // ========== Layout helpers ==========
  /**
   * Đo chiều rộng sidebar thực tế để tính padding-left tránh đè nội dung.
   */
  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      this.sidebarWidth = rect.width;
      this.sidebarExpanded = sidebar.classList.contains('show') || rect.width > 100;
    } else {
      this.sidebarWidth = 0;
      this.sidebarExpanded = false;
    }
  }

  /**
   * Padding-left động cho toàn trang, tránh bị sidebar che.
   */
  getContentPaddingLeft(): string {
    if (window.innerWidth <= 768) {
      return '0';
    }
    return `${this.sidebarWidth}px`;
  }

  /**
   * Tính max-width động cho container theo viewport và sidebar,
   * đảm bảo responsive trên mọi kích thước.
   */
  getContentMaxWidth(): string {
    const viewportWidth = window.innerWidth;

    if (viewportWidth <= 768) {
      // Mobile: full width + padding nhỏ
      return 'calc(100vw - 32px)';
    }

    const sidePadding = 48; // 24px mỗi bên
    const availableWidth = viewportWidth - this.sidebarWidth - sidePadding;

    // Giới hạn max-width để không quá rộng
    const maxContentWidth = Math.min(1200, Math.max(800, availableWidth));
    return `${maxContentWidth}px`;
  }

  onFilterChange(filter: 'all' | 'read' | 'unread') {
    this.filterStatus = filter;
    this.currentPage = 0;
    this.loadNotifications();
  }

  onTypeFilterChange(filter: 'all' | 'candidate' | 'system') {
    this.filterType = filter;
    this.currentPage = 0;
    this.loadNotifications();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadNotifications();
  }

  openCvManagement(notification: NotificationDto) {
    // Mark as read then navigate
    const nav = () => {
      window.location.href = '/recruiter/cv-management';
    };

    if (notification.isRead) {
      nav();
      return;
    }

    this.notificationService
      .markAsRead(notification.id)
      .pipe(
        catchError(error => {
          console.error('[Recruiter Notifications] Error marking as read:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        nav();
      });
  }

  markAllAsRead() {
    this.notificationService
      .markAllAsRead('Recruiter')
      .pipe(
        catchError(error => {
          console.error('[Recruiter Notifications] Error mark all as read:', error);
          this.showToastMessage('Không thể đánh dấu đã đọc', 'error');
          return of(null);
        })
      )
      .subscribe(() => {
        this.showToastMessage('Đã đánh dấu tất cả đã đọc', 'success');
        this.loadNotifications();
      });
  }

  deleteNotification(notification: NotificationDto) {
    this.notificationService.deleteNotification(notification.id)
      .pipe(
        catchError(error => {
          console.error('[Recruiter Notifications] Error deleting notification:', error);
          this.showToastMessage('Không thể xóa thông báo', 'error');
          return of(null);
        })
      )
      .subscribe(() => {
        this.showToastMessage('Đã xóa thông báo', 'success');
        this.loadNotifications();
      });
  }

  deleteAllNotifications() {
    this.notificationService.deleteAllNotifications('Recruiter')
      .pipe(
        catchError(error => {
          console.error('[Recruiter Notifications] Error deleting all notifications:', error);
          this.showToastMessage('Không thể xóa tất cả thông báo', 'error');
          return of(null);
        })
      )
      .subscribe(() => {
        this.showToastMessage('Đã xóa tất cả thông báo', 'success');
        this.loadNotifications();
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getTypeLabel(notification: NotificationDto): string {
    if (notification.notificationType === 'ApplicationSubmitted') {
      return 'Ứng viên';
    }
    return 'Hệ thống';
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}

