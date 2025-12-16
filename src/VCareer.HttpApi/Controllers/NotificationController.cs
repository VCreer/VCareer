using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VCareer.Dto.Notification;
using VCareer.IServices.Notification;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationController : AbpControllerBase
    {
        private readonly INotificationAppService _notificationAppService;

        public NotificationController(INotificationAppService notificationAppService)
        {
            _notificationAppService = notificationAppService;
        }

        /// <summary>
        /// Tạo thông báo mới
        /// </summary>
        [HttpPost]
        [Route("")]
        public async Task<ActionResult<NotificationDto>> CreateNotificationAsync([FromBody] NotificationCreateDto input)
        {
            if (input == null)
            {
                return BadRequest(new { message = "Input is required" });
            }

            var result = await _notificationAppService.CreateNotificationAsync(input);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách thông báo của user hiện tại
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<NotificationListDto>> GetNotificationsAsync(
            [FromQuery] string userRole,
            [FromQuery] int pageIndex = 0,
            [FromQuery] int pageSize = 10,
            [FromQuery] string notificationType = null,
            [FromQuery] bool? isRead = null)
        {
            if (string.IsNullOrWhiteSpace(userRole))
            {
                return BadRequest(new { message = "UserRole is required" });
            }

            var userId = CurrentUser.Id ?? throw new UnauthorizedAccessException("User not authenticated");
            var pagingDto = new PagingDto { PageIndex = pageIndex, PageSize = pageSize };

            var result = await _notificationAppService.GetNotificationsAsync(
                userId,
                userRole,
                pagingDto,
                notificationType,
                isRead
            );

            return Ok(result);
        }

        /// <summary>
        /// Lấy số lượng thông báo chưa đọc
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCountAsync([FromQuery] string userRole)
        {
            if (string.IsNullOrWhiteSpace(userRole))
            {
                return BadRequest(new { message = "UserRole is required" });
            }

            var userId = CurrentUser.Id ?? throw new UnauthorizedAccessException("User not authenticated");
            var count = await _notificationAppService.GetUnreadCountAsync(userId, userRole);
            return Ok(count);
        }

        /// <summary>
        /// Đánh dấu thông báo là đã đọc
        /// </summary>
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsReadAsync(Guid id)
        {
            await _notificationAppService.MarkAsReadAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo là đã đọc
        /// </summary>
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsReadAsync([FromQuery] string userRole)
        {
            if (string.IsNullOrWhiteSpace(userRole))
            {
                return BadRequest(new { message = "UserRole is required" });
            }

            var userId = CurrentUser.Id ?? throw new UnauthorizedAccessException("User not authenticated");
            await _notificationAppService.MarkAllAsReadAsync(userId, userRole);
            return NoContent();
        }

        /// <summary>
        /// Xóa thông báo
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotificationAsync(Guid id)
        {
            await _notificationAppService.DeleteNotificationAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Xóa tất cả thông báo của user hiện tại
        /// </summary>
        [HttpDelete("all")]
        public async Task<IActionResult> DeleteAllNotificationsAsync([FromQuery] string userRole)
        {
            if (string.IsNullOrWhiteSpace(userRole))
            {
                return BadRequest(new { message = "UserRole is required" });
            }

            var userId = CurrentUser.Id ?? throw new UnauthorizedAccessException("User not authenticated");
            await _notificationAppService.DeleteAllNotificationsAsync(userId, userRole);
            return NoContent();
        }
    }
}








