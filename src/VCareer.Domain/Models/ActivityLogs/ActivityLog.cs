using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.ActivityLogs
{
    public class ActivityLog : CreationAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public ActivityType ActivityType { get; set; }
        public Guid? EntityId { get; set; }
        public string EntityType { get; set; }
        public string Action { get; set; }
        public string Description { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }
        public string Metadata { get; set; }

        protected ActivityLog()
        {
        }

        public ActivityLog(
            Guid id,
            Guid userId,
            ActivityType activityType,
            string action,
            string description,
            Guid? entityId = null,
            string entityType = null,
            string ipAddress = null,
            string userAgent = null,
            string metadata = null
        ) : base(id)
        {
            UserId = userId;
            ActivityType = activityType;
            Action = action;
            Description = description;
            EntityId = entityId;
            EntityType = entityType;
            IpAddress = ipAddress;
            UserAgent = userAgent;
            Metadata = metadata;
        }
    }
}

































