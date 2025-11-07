using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Tag : Entity<int>
    {
        public string Name { get; set; } // Unique, lowercase.
        public string Slug { get; set; }

        public virtual ICollection<JobPostTag> JobPostingTags { get; set; } = new List<JobPostTag>();

    }
}
