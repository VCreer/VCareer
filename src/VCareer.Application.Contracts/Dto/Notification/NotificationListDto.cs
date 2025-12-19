using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Notification
{
    public class NotificationListDto : PagedResultDto<NotificationDto>
    {
        public NotificationListDto(long totalCount, IReadOnlyList<NotificationDto> items)
            : base(totalCount, items)
        {
        }

        public int UnreadCount { get; set; }
    }
}














