using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class User_ChildServiceCreateDto
    {
        public Guid UserId { get; set; }
        public Guid ChildServiceId { get; set; }
       }
    public class User_ChildServiceViewDto
    {
        public Guid UserId { get; set; }
        public Guid ChildServiceId { get; set; }
        public ChildServiceStatus Status { get; set; }
        public bool IsLifeTime { get; set; } // có vĩnh viễn ko 
        public bool IsLimitUsedTime { get; set; }  //giới hạn số lần dùng
        public int? UsedTime { get; set; } //đã dùng bao nhiêu
        public int? TotalUsageLimit { get; set; }  //tổng lượt được phép dùng
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class User_ChildServiceUpdateDto
    {
        public ChildServiceStatus Status { get; set; }
        public int? UsedTime { get; set; } //đã dùng bao nhiêu
        public int? TotalUsageLimit { get; set; }  //tổng lượt được phép dùng
        public DateTime? EndDate { get; set; }
    }
}
