using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.JobCategory
{
    public class JobTag : Entity<int>
    {
        public Guid JobId { get; set; }
        public int TagId { get; set; }
        public virtual Job_Post Job { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
