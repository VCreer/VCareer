using System;
using VCareer.Models.ActivityLogs;

namespace VCareer.Dto.ActivityLogDto
{
    public class ActivityLogWithStaffDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string StaffId { get; set; }
        public string StaffName { get; set; }
        public string StaffEmail { get; set; }
        public ActivityType ActivityType { get; set; }
        public string ActivityTypeName { get; set; }
        public string Action { get; set; }
        public string Description { get; set; }
        public DateTime CreationTime { get; set; }
    }
}



