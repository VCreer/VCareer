using System;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Notification
{
    public class NotificationDto : EntityDto<Guid>
    {
        public Guid UserId { get; set; }
        public string UserRole { get; set; }
        public string NotificationType { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string RelatedEntityType { get; set; }
        public Guid? RelatedEntityId { get; set; }
        public string Metadata { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime CreationTime { get; set; }
    }
}








