using System;
using System.Threading.Tasks;
using VCareer.Dto.Notification;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.Notification
{
    public interface INotificationAppService : IApplicationService
    {
        /// <summary>
        /// Tạo thông báo mới
        /// </summary>
        Task<NotificationDto> CreateNotificationAsync(NotificationCreateDto input);

        /// <summary>
        /// Lấy danh sách thông báo của user
        /// </summary>
        Task<NotificationListDto> GetNotificationsAsync(
            Guid userId,
            string userRole,
            PagingDto pagingDto,
            string notificationType = null,
            bool? isRead = null);

        /// <summary>
        /// Lấy số lượng thông báo chưa đọc
        /// </summary>
        Task<int> GetUnreadCountAsync(Guid userId, string userRole);

        /// <summary>
        /// Đánh dấu thông báo là đã đọc
        /// </summary>
        Task MarkAsReadAsync(Guid notificationId);

        /// <summary>
        /// Đánh dấu tất cả thông báo là đã đọc
        /// </summary>
        Task MarkAllAsReadAsync(Guid userId, string userRole);

        /// <summary>
        /// Xóa thông báo
        /// </summary>
        Task DeleteNotificationAsync(Guid notificationId);

        /// <summary>
        /// Xóa tất cả thông báo của user
        /// </summary>
        Task DeleteAllNotificationsAsync(Guid userId, string userRole);
    }
}








