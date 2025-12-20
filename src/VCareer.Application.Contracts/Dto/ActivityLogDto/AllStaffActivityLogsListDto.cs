using System.Collections.Generic;

namespace VCareer.Dto.ActivityLogDto
{
    public class AllStaffActivityLogsListDto
    {
        public List<ActivityLogWithStaffDto> Activities { get; set; }
        public int TotalCount { get; set; }

        public AllStaffActivityLogsListDto()
        {
            Activities = new List<ActivityLogWithStaffDto>();
        }
    }
}












