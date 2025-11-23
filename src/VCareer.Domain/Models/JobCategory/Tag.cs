using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.JobCategory
{
    public class Tag : Entity<int>
    {
        public string Name { get; set; }
        public Guid CategoryId { get; set; }

        public virtual ICollection<JobTag> JobTags { get; set; } = new List<JobTag>();
        public virtual ICollection<Categoty_Tag> CategotyTags { get; set; } = new List<Categoty_Tag>();


    }
}
