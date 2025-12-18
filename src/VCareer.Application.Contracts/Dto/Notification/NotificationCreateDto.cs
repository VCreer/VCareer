using System;
using System.ComponentModel.DataAnnotations;

namespace VCareer.Dto.Notification
{
    public class NotificationCreateDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string UserRole { get; set; }

        [Required]
        [StringLength(50)]
        public string NotificationType { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [Required]
        [StringLength(500)]
        public string Message { get; set; }

        [StringLength(50)]
        public string RelatedEntityType { get; set; }

        public Guid? RelatedEntityId { get; set; }

        public string Metadata { get; set; }

        public Guid? CreatedBy { get; set; }
    }
}








