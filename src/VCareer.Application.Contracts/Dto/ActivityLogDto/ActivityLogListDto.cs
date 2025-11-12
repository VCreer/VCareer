using System.Collections.Generic;

namespace VCareer.Dto.ActivityLogDto
{
    public class ActivityLogListDto
    {
        public StaffInfoDto StaffInfo { get; set; }
        public List<ActivityLogDto> Activities { get; set; }
        public ActivityStatisticsDto Statistics { get; set; }
        public int TotalCount { get; set; }

        public ActivityLogListDto()
        {
            Activities = new List<ActivityLogDto>();
        }
    }
}





























