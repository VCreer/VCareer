import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  NotificationService,
  NotificationDto,
} from '../../../../core/services/notification.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { JobSearchService } from '../../../../proxy/services/job/job-search.service';
import { GeoService as ProxyGeoService } from '../../../../proxy/services/geo/geo.service';
import { catchError, of, forkJoin } from 'rxjs';

interface NotificationWithJobInfo extends NotificationDto {
  jobTitle?: string;
  companyName?: string;
  jobId?: string;
  salary?: string;
  salaryText?: string;
  location?: string;
  provinceName?: string;
  experienceText?: string;
  logo?: string;
  jobData?: any; // Full job data from API
  deadline?: string; // Job application deadline
  daysUntilDeadline?: number; // Days remaining until deadline
  isExpired?: boolean; // Whether the job application deadline has passed
  expiresAt?: string; // Expiration from live job data (if available)
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent, ButtonComponent, PaginationComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationWithJobInfo[] = [];
  isLoading = false;
  totalCount = 0;
  unreadCount = 0;
  currentPage = 0;
  pageSize = 5; // 5 thông báo trong 1  trang
  totalPages = 0;
  filterStatus: 'all' | 'read' | 'unread' = 'all';
  filterType: 'all' | 'CvViewed' | 'JobOffer' = 'all';

  // Delete state
  isDeletingAll = false;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private translationService: TranslationService,
    private jobSearchService: JobSearchService,
    private geoService: ProxyGeoService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications() {
    this.isLoading = true;

    // Determine filter value for API
    let isReadFilter: boolean | undefined = undefined;
    if (this.filterStatus === 'read') {
      isReadFilter = true;
    } else if (this.filterStatus === 'unread') {
      isReadFilter = false;
    }

    // Determine notificationType filter
    let notificationTypeFilter: string | undefined = undefined;
    if (this.filterType === 'CvViewed') {
      notificationTypeFilter = 'CvViewed';
    } else if (this.filterType === 'JobOffer') {
      notificationTypeFilter = 'JobOffer';
    }

    // lấy thông báo
    this.notificationService
      .getNotifications(
        'Candidate',
        this.currentPage,
        this.pageSize,
        notificationTypeFilter,
        isReadFilter
      )
      .pipe(
        catchError(error => {
          console.error('[Notifications] Error loading notifications:', error);
          this.showToastMessage('Không thể tải thông báo', 'error');
          return of({ items: [], totalCount: 0, unreadCount: 0 } as any);
        })
      )
      .subscribe(result => {
        this.notifications = this.enrichNotificationsWithJobInfo(result.items);
        this.totalCount = result.totalCount;
        this.unreadCount = result.unreadCount;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.isLoading = false;
      });
  }

  loadUnreadCount() {
    this.notificationService
      .getUnreadCount('Candidate')
      .pipe(
        catchError(error => {
          console.error('[Notifications] Error loading unread count:', error);
          return of(0);
        })
      )
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  enrichNotificationsWithJobInfo(notifications: NotificationDto[]): NotificationWithJobInfo[] {
    const enriched = notifications.map((notification, index) => {
      const result: NotificationWithJobInfo = { ...notification };

      // Parse metadata để lấy thông tin job
      if (notification.metadata) {
        try {
          const metadata = JSON.parse(notification.metadata);
          result.jobTitle = metadata.JobTitle || metadata.jobTitle;
          result.companyName = metadata.CompanyName || metadata.companyName;
          result.jobId = metadata.JobId || metadata.jobId || notification.relatedEntityId;
          console.log('[Notifications] Parsed metadata', {
            notificationId: notification.id,
            metadata,
          });
          // Check metadata for expiration flags
          const metaStatus = (metadata.Status || metadata.status || '').toString().toLowerCase();
          const metaExpired =
            metadata.IsExpired ?? metadata.isExpired ?? metadata.Expired ?? metadata.expired;
          if (
            metaExpired === true ||
            metaStatus === 'expired' ||
            metaStatus === 'closed' ||
            metaStatus === 'inactive'
          ) {
            result.isExpired = true;
          }
          // Parse deadline from metadata
          const metaDeadline =
            metadata.applicationDeadline ||
            metadata.ApplicationDeadline ||
            metadata.deadline ||
            metadata.Deadline ||
            metadata.expiryDate ||
            metadata.ExpiryDate ||
            metadata.endDate ||
            metadata.EndDate ||
            metadata.applicationEndDate ||
            metadata.ApplicationEndDate ||
            metadata.closeDate ||
            metadata.CloseDate;
          if (!result.deadline && metaDeadline) {
            console.log('[Notifications] Metadata deadline detected', {
              notificationId: notification.id,
              metaDeadline,
            });
            result.deadline = metaDeadline;
            const deadlineDate = new Date(metaDeadline);
            const now = new Date();
            const diffTime = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            result.isExpired = result.isExpired || diffDays < 0;
            result.daysUntilDeadline = diffDays;
          }
        } catch (e) {
          console.error(
            `[Notifications] Error parsing metadata for notification ${index}:`,
            e,
            notification.metadata
          );
        }
      }

      // Nếu không có trong metadata, lấy từ relatedEntityId
      if (!result.jobId && notification.relatedEntityId) {
        result.jobId = notification.relatedEntityId;
      }

      // Log để debug
      if (!result.jobId) {
        console.warn(`[Notifications] Notification ${index} has no jobId:`, {
          id: notification.id,
          relatedEntityType: notification.relatedEntityType,
          relatedEntityId: notification.relatedEntityId,
          metadata: notification.metadata,
        });
      }

      // Default logo
      result.logo = 'assets/images/vng.png';

      return result;
    });

    // Load job details for notifications with jobId
    this.loadJobDetailsForNotifications(enriched);

    return enriched;
  }

  loadJobDetailsForNotifications(notifications: NotificationWithJobInfo[]) {
    // Filter notifications that need job details and create a map to track them
    const notificationsWithJobId = notifications
      .filter(n => n.relatedEntityType === 'JobPost' && n.jobId)
      .map((n, index) => ({ notification: n, originalIndex: index, jobId: n.jobId! }));

    if (notificationsWithJobId.length === 0) {
      console.log('[Notifications] No notifications with jobId to load details for');
      return;
    }

    // Get unique job IDs to avoid loading duplicates
    const uniqueJobIds = [...new Set(notificationsWithJobId.map(n => n.jobId))];
    console.log('[Notifications] Loading job details for', uniqueJobIds.length, 'unique jobs');

    // Load job details for all unique job IDs
    const jobRequests = uniqueJobIds.map(jobId =>
      this.jobSearchService.getJobById(jobId).pipe(
        catchError(error => {
          console.error(`[Notifications] Error loading job ${jobId}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(jobRequests).subscribe(jobs => {
      // Create a map of jobId -> job for quick lookup
      const jobMap = new Map<string, any>();
      uniqueJobIds.forEach((jobId, index) => {
        if (jobs[index]) {
          jobMap.set(jobId, jobs[index]);
        }
      });

      // Update all notifications with their corresponding job data
      notificationsWithJobId.forEach(({ notification, jobId }) => {
        const job = jobMap.get(jobId);
        if (job) {
          console.log('[Notifications] Updating notification with job data', {
            notificationId: notification.id,
            jobId,
            status: job.status,
            statusName: job.statusName,
            state: job.state,
            isActive: job.isActive,
            isExpired: job.isExpired,
            allowApply: job.allowApply,
            isClosed: job.isClosed,
            isDisabled: job.isDisabled,
            isDeleted: job.isDeleted,
            isArchived: job.isArchived,
            isPublished: job.isPublished,
            deadline:
              job.applicationDeadline ||
              job.deadline ||
              job.expiryDate ||
              job.endDate ||
              job.applicationEndDate ||
              job.closeDate ||
              job.expiresAt,
          });

          notification.jobData = job;
          notification.jobTitle = job.title || notification.jobTitle;
          notification.companyName = job.companyName || notification.companyName;
          // If backend marks a job as inactive/closed, treat as expired
          if (
            job.isActive === false ||
            job.isExpired === true ||
            job.allowApply === false ||
            job.isClosed === true ||
            job.isDisabled === true ||
            job.isDeleted === true ||
            job.isArchived === true ||
            job.isPublished === false ||
            (job.status &&
              ['closed', 'expired', 'archived', 'inactive', 'disabled'].includes(
                String(job.status).toLowerCase()
              )) ||
            (job.statusName &&
              ['closed', 'expired', 'archived', 'inactive', 'disabled'].includes(
                String(job.statusName).toLowerCase()
              )) ||
            (job.state &&
              ['closed', 'expired', 'archived', 'inactive', 'disabled'].includes(
                String(job.state).toLowerCase()
              ))
          ) {
            notification.isExpired = true;
          }

          // Log expiry info (job data)
          const jobDeadline =
            job.applicationDeadline ||
            job.deadline ||
            job.expiryDate ||
            job.endDate ||
            job.applicationEndDate ||
            job.closeDate ||
            job.expiresAt;

          if (jobDeadline) {
            console.log('[Candidate Notifications] Job expiry (job data)', {
              notificationId: notification.id,
              jobId,
              deadline: jobDeadline,
            });
          } else if (notification.deadline) {
            console.log('[Candidate Notifications] Job expiry (metadata)', {
              notificationId: notification.id,
              jobId,
              deadline: notification.deadline,
            });
          } else {
            console.log('[Candidate Notifications] Job expiry missing', {
              notificationId: notification.id,
              jobId,
              jobKeys: Object.keys(job || {}),
            });
          }

          // Format salary
          if (job.salaryMin && job.salaryMax) {
            notification.salaryText = `${this.formatSalary(job.salaryMin)} - ${this.formatSalary(
              job.salaryMax
            )} VNĐ`;
          } else if (job.salaryMin) {
            notification.salaryText = `Từ ${this.formatSalary(job.salaryMin)} VNĐ`;
          } else if (job.salaryDeal) {
            notification.salaryText = 'Thỏa thuận';
          } else {
            notification.salaryText = 'Thỏa thuận';
          }

          // Location - Use workLocation or lookup province name from provinceCode
          if (job.workLocation) {
            notification.provinceName = job.workLocation;
          } else if (job.provinceCode) {
            // Lookup province name using GeoService
            this.geoService
              .getProvinceNameByCodeByProvinceCode(job.provinceCode)
              .pipe(
                catchError(error => {
                  console.error(
                    `[Notifications] Error getting province name for code ${job.provinceCode}:`,
                    error
                  );
                  return of('');
                })
              )
              .subscribe(provinceName => {
                if (provinceName) {
                  notification.provinceName = provinceName;
                }
              });
          }

          // Experience
          if (job.experience !== undefined && job.experience !== null) {
            notification.experienceText = this.getExperienceText(job.experience);
          }

          // Deadline - Check various possible field names
          const deadline =
            job.applicationDeadline ||
            job.deadline ||
            job.expiryDate ||
            job.endDate ||
            job.applicationEndDate ||
            job.closeDate ||
            job.expiresAt;
          if (deadline) {
            notification.deadline = deadline;
            notification.expiresAt = deadline;
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const diffTime = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            notification.isExpired = notification.isExpired || diffDays < 0;
            notification.daysUntilDeadline = diffDays;
            console.log('[Notifications] Deadline computed', {
              notificationId: notification.id,
              jobId,
              deadline,
              diffDays,
              isExpired: notification.isExpired,
            });
          } else if (notification.deadline) {
            // fallback: metadata deadline already parsed above
            const deadlineDate = new Date(notification.deadline);
            const now = new Date();
            const diffTime = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            notification.isExpired = notification.isExpired || diffDays < 0;
            notification.daysUntilDeadline = diffDays;
            console.log('[Notifications] Metadata-only deadline computed', {
              notificationId: notification.id,
              jobId,
              deadline: notification.deadline,
              diffDays,
              isExpired: notification.isExpired,
            });
          }
        } else {
          console.warn(`[Notifications] Job data not found for jobId: ${jobId} -> mark as expired`);
          notification.isExpired = true;
        }
      });

      // Force change detection to update UI
      this.notifications = [...this.notifications];
    });
  }

  formatSalary(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  getExperienceText(level: any): string {
    // Handle ExperienceLevel enum
    if (typeof level === 'number') {
      const experienceMap: { [key: number]: string } = {
        0: 'Không yêu cầu',
        1: 'Dưới 1 năm',
        2: '1 năm',
        3: '2 năm',
        4: '3 năm',
        5: '4 năm',
        6: '5 năm',
        7: '6 năm',
        8: '7 năm',
        9: '8 năm',
        10: '9 năm',
        11: '10 năm',
        12: 'Trên 10 năm',
      };
      return experienceMap[level] || 'Không yêu cầu';
    }

    // Handle string values
    const levelStr = String(level);
    const experienceMap: { [key: string]: string } = {
      NoExperience: 'Không yêu cầu',
      LessThanOneYear: 'Dưới 1 năm',
      OneToThreeYears: '1-3 năm',
      ThreeToFiveYears: '3-5 năm',
      FiveToTenYears: '5-10 năm',
      MoreThanTenYears: 'Trên 10 năm',
      None: 'Không yêu cầu',
      Under1: 'Dưới 1 năm',
      Year1: '1 năm',
      Year2: '2 năm',
      Year3: '3 năm',
      Year4: '4 năm',
      Year5: '5 năm',
      Year6: '6 năm',
      Year7: '7 năm',
      Year8: '8 năm',
      Year9: '9 năm',
      Year10: '10 năm',
      Over10: 'Trên 10 năm',
    };
    return experienceMap[levelStr] || levelStr;
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadNotifications();
  }

  onFilterChange(filter: 'all' | 'read' | 'unread') {
    this.filterStatus = filter;
    this.currentPage = 0;
    this.loadNotifications();
  }

  onTypeFilterChange(filter: 'all' | 'CvViewed' | 'JobOffer') {
    this.filterType = filter;
    this.currentPage = 0;
    this.loadNotifications();
  }

  navigateToJobDetail(notification: NotificationWithJobInfo) {
    // Don't navigate if job is expired
    if (notification.isExpired) {
      return;
    }

    if (notification.relatedEntityType === 'JobPost' && notification.jobId) {
      this.markAsRead(notification);
      this.router.navigate(['/candidate/job-detail', notification.jobId]);
    }
  }

  getDeadlineText(notification: NotificationWithJobInfo): string {
    if (!notification.deadline) {
      return notification.isExpired ? 'Đã hết hạn nộp' : '';
    }

    if (notification.isExpired) {
      return 'Đã hết hạn nộp';
    }

    const days = notification.daysUntilDeadline || 0;
    if (days === 0) {
      return 'Hết hạn hôm nay';
    } else if (days === 1) {
      return 'Còn 1 ngày';
    } else {
      return `Còn ${days} ngày`;
    }
  }

  onCardClick(notification: NotificationWithJobInfo) {
    if (notification.isExpired) {
      console.log('[Notifications] Click blocked because job expired', {
        notificationId: notification.id,
        jobId: notification.jobId,
        deadline: notification.deadline,
        daysUntilDeadline: notification.daysUntilDeadline,
        expiresAt: notification.expiresAt,
      });
      return;
    }
    this.navigateToJobDetail(notification);
  }

  markAsRead(notification: NotificationWithJobInfo) {
    if (notification.isRead) return;

    this.notificationService
      .markAsRead(notification.id)
      .pipe(
        catchError(error => {
          console.error('[Notifications] Error marking as read:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        notification.isRead = true;
        this.loadUnreadCount();
      });
  }

  deleteNotification(notification: NotificationWithJobInfo, event: Event) {
    event.stopPropagation(); // Prevent navigation

    this.notificationService
      .deleteNotification(notification.id)
      .pipe(
        catchError(error => {
          console.error('[Notifications] Error deleting notification:', error);
          this.showToastMessage('Không thể xóa thông báo', 'error');
          return of(null);
        })
      )
      .subscribe(() => {
        this.showToastMessage('Đã xóa thông báo', 'success');
        // Reload notifications from server to ensure consistency
        this.loadNotifications();
        this.loadUnreadCount();
      });
  }

  deleteAllNotifications() {
    if (this.isDeletingAll) return; // Prevent double click

    console.log('[Notifications] Starting delete all notifications');
    this.isDeletingAll = true;

    this.notificationService
      .deleteAllNotifications('Candidate')
      .pipe(
        catchError(error => {
          console.error('[Notifications] Error deleting all notifications:', error);
          console.error('[Notifications] Error status:', error.status);
          console.error('[Notifications] Error message:', error.message);
          console.error('[Notifications] Error details:', error.error);

          this.isDeletingAll = false;

          let errorMessage = 'Không thể xóa tất cả thông báo';
          if (error.status === 401) {
            errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          } else if (error.status === 403) {
            errorMessage = 'Bạn không có quyền xóa thông báo.';
          } else if (error.status === 404) {
            errorMessage = 'Không tìm thấy thông báo để xóa.';
          } else if (error.status === 0) {
            errorMessage = 'Lỗi kết nối server. Vui lòng thử lại.';
          }

          this.showToastMessage(errorMessage, 'error');
          return of(null);
        })
      )
      .subscribe({
        next: result => {
          console.log('[Notifications] Successfully deleted all notifications', result);
          this.isDeletingAll = false;
          this.showToastMessage('Đã xóa tất cả thông báo', 'success');
          // Reload notifications from server to ensure consistency
          this.currentPage = 0;
          this.loadNotifications();
          this.loadUnreadCount();
        },
        error: error => {
          console.error('[Notifications] Subscription error:', error);
          this.isDeletingAll = false;
        },
      });
  }

  markAllAsRead() {
    this.notificationService
      .markAllAsRead('Candidate')
      .pipe(
        catchError(error => {
          console.error('[Notifications] Error marking all as read:', error);
          this.showToastMessage('Không thể đánh dấu tất cả đã đọc', 'error');
          return of(null);
        })
      )
      .subscribe(() => {
        this.showToastMessage('Đã đánh dấu tất cả đã đọc', 'success');
        this.loadNotifications();
        this.loadUnreadCount();
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

  showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}
