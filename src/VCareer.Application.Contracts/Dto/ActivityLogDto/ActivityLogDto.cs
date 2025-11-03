using System;
using System.Collections.Generic;
using VCareer.Models.ActivityLogs;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.ActivityLogDto
{
    public class ActivityLogDto : EntityDto<Guid>
    {
        public Guid UserId { get; set; }
        public ActivityType ActivityType { get; set; }
        public string ActivityTypeName { get; set; }
        public Guid? EntityId { get; set; }
        public string EntityType { get; set; }
        public string Action { get; set; }
        public string Description { get; set; }
        public string IpAddress { get; set; }
        public DateTime CreationTime { get; set; }
        public Dictionary<string, object> Metadata { get; set; }
    }
}











