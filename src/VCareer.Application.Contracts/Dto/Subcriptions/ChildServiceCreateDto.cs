using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class ChildServiceCreateDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public ServiceAction Action { get; set; }
        public ServiceTarget Target { get; set; }
        public bool IsActive { get; set; }
        public bool IsLifeTime { get; set; } = false;
        public bool IsAutoActive { get; set; } = false;
        public bool IsLimitUsedTime { get; set; }  //giới hạn số lần dùng
        public int? TimeUsedLimit { get; set; }
        public int? DayDuration { get; set; }
        public int? Value { get; set; }
    }

    public class ChildServiceUpdateDto
    {
        public Guid CHildServiceId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
    public class ChildServiceViewDto
    {
        public Guid CHildServiceId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public ServiceAction Action { get; set; }
        public ServiceTarget Target { get; set; }
        public bool IsLimitUsedTime { get; set; }  //giới hạn số lần dùng
        public bool IsActive { get; set; }
        public bool IsLifeTime { get; set; } = false;
        public bool IsAutoActive { get; set; } = false;
        public int? TimeUsedLimit { get; set; }
        public int? DayDuration { get; set; }
        public int? Value { get; set; }
    }
}
