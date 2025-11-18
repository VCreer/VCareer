using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.JobCategory
{
    public class Categoty_Tag :Entity<int>
    {
        public Guid CategoryId { get; set; }
        public int TagId { get; set; }
        public virtual Job_Category Category { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
