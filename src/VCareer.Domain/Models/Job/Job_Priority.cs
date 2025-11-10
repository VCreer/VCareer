using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.JobConstant;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Job
{
    public class Job_Priority : Entity<int>
    {
        public Guid JobId { get; set; }
        public JobDisplayArea DisplayArea { get; set; }
        public JobPriorityLevel PriorityLevel { get; set; }
        public float SortScore { get; set; } = 0; // được tính bằng tổng trọng số * tiêu chí ..vv

        public virtual Job_Post Job { get; set; }

    }
}
