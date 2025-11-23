using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Subcription
{
    public class ChildService_SubcriptionService :Entity<Guid>
    {
        public Guid ChildServiceId { get; set; }
        public Guid SubcriptionServiceId { get; set; }

        public  virtual ChildService ChildService { get; set; }
        public virtual SubcriptionService SubcriptionService { get; set; }
    }
}
