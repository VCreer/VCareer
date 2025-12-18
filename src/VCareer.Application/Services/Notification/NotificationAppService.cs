using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VCareer.Dto.Notification;
using VCareer.IRepositories.Notification;
using VCareer.IServices.Notification;
using VCareer.Models.Notification;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using UserNotification = VCareer.Models.Notification.UserNotification;

namespace VCareer.Services.Notification
{
    [Authorize]
    public class NotificationAppService : ApplicationService, INotificationAppService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly ICurrentUser _currentUser;

        public NotificationAppService(
            INotificationRepository notificationRepository,
            ICurrentUser currentUser)
        {
            _notificationRepository = notificationRepository;
            _currentUser = currentUser;
        }


        //taoj 1 thoong bao
        public async Task<NotificationDto> CreateNotificationAsync(NotificationCreateDto input)
        {
            if (input == null)
            {
                throw new UserFriendlyException("Input không hợp lệ");
            }

            var notification = new UserNotification(
                GuidGenerator.Create(),
                input.UserId,
                input.UserRole,
                input.NotificationType,
                input.Title,
                input.Message,
                input.RelatedEntityType,
                input.RelatedEntityId,
                input.Metadata,
                input.CreatedBy ?? _currentUser.Id
            );

            await _notificationRepository.InsertAsync(notification);

            return ObjectMapper.Map<UserNotification, NotificationDto>(notification);
        }

        public async Task<NotificationListDto> GetNotificationsAsync(
            Guid userId,
            string userRole,
            PagingDto pagingDto,
            string notificationType = null,
            bool? isRead = null)
        {
            Logger.LogInformation("GetNotificationsAsync: Called with UserId: {UserId}, UserRole: {UserRole}, CurrentUser.Id: {CurrentUserId}",
                userId, userRole, _currentUser.Id);

            // Verify user chỉ có thể xem thông báo của chính mình
            if (!_currentUser.Id.HasValue || _currentUser.Id.Value != userId)
            {
                Logger.LogWarning("GetNotificationsAsync: User mismatch. CurrentUser.Id: {CurrentUserId}, Requested UserId: {UserId}",
                    _currentUser.Id, userId);
                throw new UserFriendlyException("Bạn không có quyền xem thông báo của người khác");
            }

            var queryable = await _notificationRepository.GetQueryableAsync();
            Logger.LogInformation("GetNotificationsAsync: Total notifications in DB before filter: {Count}",
                await AsyncExecuter.CountAsync(queryable));

            queryable = queryable.Where(n => n.UserId == userId && n.UserRole == userRole);
            
            Logger.LogInformation("GetNotificationsAsync: Notifications after UserId and UserRole filter: {Count}",
                await AsyncExecuter.CountAsync(queryable));

            // Filter by notification type
            if (!string.IsNullOrWhiteSpace(notificationType))
            {
                queryable = queryable.Where(n => n.NotificationType == notificationType);
            }

            // Filter by read status
            if (isRead.HasValue)
            {
                queryable = queryable.Where(n => n.IsRead == isRead.Value);
            }

            // Get total count
            var totalCount = await AsyncExecuter.CountAsync(queryable);

            // Order by creation time descending (newest first)
            queryable = queryable.OrderByDescending(n => n.CreationTime);

            // Apply pagination
            var notifications = await AsyncExecuter.ToListAsync(
                queryable
                    .Skip(pagingDto.PageIndex * pagingDto.PageSize)
                    .Take(pagingDto.PageSize)
            );

            var notificationDtos = ObjectMapper.Map<List<UserNotification>, List<NotificationDto>>(notifications);

            Logger.LogInformation("GetNotificationsAsync: Found {Count} notifications, TotalCount: {TotalCount}",
                notificationDtos.Count, totalCount);

            // Get unread count
            var unreadCount = await GetUnreadCountAsync(userId, userRole);

            Logger.LogInformation("GetNotificationsAsync: UnreadCount: {UnreadCount}", unreadCount);

            return new NotificationListDto(totalCount, notificationDtos)
            {
                UnreadCount = unreadCount
            };
        }

        public async Task<int> GetUnreadCountAsync(Guid userId, string userRole)
        {
            Logger.LogInformation("GetUnreadCountAsync: Called with UserId: {UserId}, UserRole: {UserRole}, CurrentUser.Id: {CurrentUserId}",
                userId, userRole, _currentUser.Id);

            // Verify user chỉ có thể xem số lượng thông báo của chính mình
            if (!_currentUser.Id.HasValue || _currentUser.Id.Value != userId)
            {
                Logger.LogWarning("GetUnreadCountAsync: User mismatch. CurrentUser.Id: {CurrentUserId}, Requested UserId: {UserId}",
                    _currentUser.Id, userId);
                throw new UserFriendlyException("Bạn không có quyền xem thông báo của người khác");
            }

            var queryable = await _notificationRepository.GetQueryableAsync();
            var count = await AsyncExecuter.CountAsync(
                queryable.Where(n => n.UserId == userId && n.UserRole == userRole && !n.IsRead)
            );

            Logger.LogInformation("GetUnreadCountAsync: Unread count: {Count}", count);
            return count;
        }

        public async Task MarkAsReadAsync(Guid notificationId)
        {
            var notification = await _notificationRepository.GetAsync(notificationId);

            // Verify user chỉ có thể đánh dấu thông báo của chính mình
            if (!_currentUser.Id.HasValue || _currentUser.Id.Value != notification.UserId)
            {
                throw new UserFriendlyException("Bạn không có quyền thao tác với thông báo này");
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.Now;
                await _notificationRepository.UpdateAsync(notification);
            }
        }

        public async Task MarkAllAsReadAsync(Guid userId, string userRole)
        {
            // Verify user chỉ có thể đánh dấu thông báo của chính mình
            if (!_currentUser.Id.HasValue || _currentUser.Id.Value != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền thao tác với thông báo của người khác");
            }

            var queryable = await _notificationRepository.GetQueryableAsync();
            var unreadNotifications = await AsyncExecuter.ToListAsync(
                queryable.Where(n => n.UserId == userId && n.UserRole == userRole && !n.IsRead)
            );

            var now = DateTime.Now;
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = now;
            }

            if (unreadNotifications.Any())
            {
                foreach (var notification in unreadNotifications)
                {
                    await _notificationRepository.UpdateAsync(notification);
                }
            }
        }

        public async Task DeleteNotificationAsync(Guid notificationId)
        {
            var notification = await _notificationRepository.GetAsync(notificationId);

            // Verify user chỉ có thể xóa thông báo của chính mình
            if (!_currentUser.Id.HasValue || _currentUser.Id.Value != notification.UserId)
            {
                throw new UserFriendlyException("Bạn không có quyền xóa thông báo này");
            }

            await _notificationRepository.DeleteAsync(notification);
        }

        public async Task DeleteAllNotificationsAsync(Guid userId, string userRole)
        {
            Logger.LogInformation("DeleteAllNotificationsAsync: Called with UserId: {UserId}, UserRole: {UserRole}, CurrentUser.Id: {CurrentUserId}",
                userId, userRole, _currentUser.Id);

            // Verify user chỉ có thể xóa thông báo của chính mình
            if (!_currentUser.Id.HasValue || _currentUser.Id.Value != userId)
            {
                Logger.LogWarning("DeleteAllNotificationsAsync: User mismatch. CurrentUser.Id: {CurrentUserId}, Requested UserId: {UserId}",
                    _currentUser.Id, userId);
                throw new UserFriendlyException("Bạn không có quyền xóa thông báo của người khác");
            }

            var queryable = await _notificationRepository.GetQueryableAsync();
            var allNotifications = await AsyncExecuter.ToListAsync(
                queryable.Where(n => n.UserId == userId && n.UserRole == userRole)
            );

            Logger.LogInformation("DeleteAllNotificationsAsync: Found {Count} notifications to delete", allNotifications.Count);

            if (allNotifications.Any())
            {
                // Use batch delete for better performance
                foreach (var notification in allNotifications)
                {
                    await _notificationRepository.DeleteAsync(notification);
                }
                
                Logger.LogInformation("DeleteAllNotificationsAsync: Successfully deleted {Count} notifications", allNotifications.Count);
            }
            else
            {
                Logger.LogInformation("DeleteAllNotificationsAsync: No notifications found to delete");
            }
        }
    }
}

