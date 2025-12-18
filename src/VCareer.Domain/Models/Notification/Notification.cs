using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Notification
{
    /// <summary>
    /// UserNotification entity - Thông báo cho tất cả các roles
    /// </summary>
    public class UserNotification : CreationAuditedAggregateRoot<Guid>
    {
        /// <summary>
        /// User ID của người nhận thông báo
        /// </summary>
        public Guid UserId { get; set; }

        /// <summary>
        /// Role của user nhận thông báo: "Candidate", "Recruiter", "Employee"
        /// </summary>
        public string UserRole { get; set; }

        /// <summary>
        /// Loại thông báo: "CvViewed", "JobInvite", "ApplicationStatusChanged", etc.
        /// </summary>
        public string NotificationType { get; set; }

        /// <summary>
        /// Tiêu đề thông báo
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Nội dung chi tiết thông báo
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Đã đọc chưa
        /// </summary>
        public bool IsRead { get; set; }

        /// <summary>
        /// Thời gian đọc
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// Loại entity liên quan: "JobPost", "CandidateCv", "Application", etc.
        /// </summary>
        public string RelatedEntityType { get; set; }

        /// <summary>
        /// ID của entity liên quan (JobId, CvId, ApplicationId, etc.)
        /// </summary>
        public Guid? RelatedEntityId { get; set; }

        /// <summary>
        /// Metadata dạng JSON chứa thông tin bổ sung (JobTitle, CompanyName, etc.)
        /// </summary>
        public string Metadata { get; set; }

        /// <summary>
        /// User ID của người tạo thông báo (RecruiterId nếu là CvViewed)
        /// </summary>
        public Guid? CreatedBy { get; set; }

        protected UserNotification()
        {
        }

        public UserNotification(
            Guid id,
            Guid userId,
            string userRole,
            string notificationType,
            string title,
            string message,
            string relatedEntityType = null,
            Guid? relatedEntityId = null,
            string metadata = null,
            Guid? createdBy = null
        ) : base(id)
        {
            UserId = userId;
            UserRole = userRole;
            NotificationType = notificationType;
            Title = title;
            Message = message;
            IsRead = false;
            ReadAt = null;
            RelatedEntityType = relatedEntityType;
            RelatedEntityId = relatedEntityId;
            Metadata = metadata;
            CreatedBy = createdBy;
        }
    }
}

