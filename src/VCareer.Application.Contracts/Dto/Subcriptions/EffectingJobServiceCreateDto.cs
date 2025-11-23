using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Dto.Subcriptions
{
    public class EffectingJobServiceCreateDto
    {
        public Guid JobPostId { get; set; }
        public Guid ChildServiceId { get; set; }
    }
    public class EffectingJobServiceUpdateDto
    {
        public Guid EffectingJobServiceId { get; set; }
        public DateTime? EndDate { get; set; }
        public ChildServiceStatus Status { get; set; }
    }

    public class EffectingJobServiceViewDto
    {
        public Guid EffectingJobServiceId { get; set; }
        public Guid JobPostId { get; set; }
        public Guid ChildServiceId { get; set; }
        public ServiceAction Action { get; set; }
        public ServiceTarget Target { get; set; }
        public ChildServiceStatus Status { get; set; }
        public int? Value { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }


}
