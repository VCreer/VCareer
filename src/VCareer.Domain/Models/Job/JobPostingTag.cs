using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Job
{
    public class JobPostingTag : Entity<int>
    {

        public Guid JobPostingId { get; set; }
        public Guid TagId { get; set; }
        public virtual Job_Posting JobPosting { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
