using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.Models.Job;
using Volo.Abp.Domain.Entities.Auditing;
using static VCareer.Constants.JobConstant.SubcriptionContance;

namespace VCareer.Models.Subcription
{
    public class EffectingJobService : FullAuditedAggregateRoot<Guid>
    {
        public Guid User_ChildServiceId { get; set; }
        public Guid JobPostId { get; set; }
        public Guid ChildServiceId { get; set; }
        public ServiceAction Action { get; set; }
        public ServiceTarget Target { get; set; }
        public ChildServiceStatus Status { get; set; } = ChildServiceStatus.Active;
        public int? Value { get; set; }
        public JobPriorityLevel? PriorityLevel { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public virtual Job_Post JobPost { get; set; }
        public virtual ChildService ChildService { get; set; }
        public virtual User_ChildService User_ChildService { get; set; }

    }
}
