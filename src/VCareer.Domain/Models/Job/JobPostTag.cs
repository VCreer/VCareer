using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Job
{
    public class JobPostTag : Entity<int>
    {

        public Guid JobPostingId { get; set; }
        public int TagId { get; set; }
        public virtual Job_Post JobPosting { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
