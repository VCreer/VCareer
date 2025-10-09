using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.Job
{
    public class Province : FullAuditedAggregateRoot<int>
    {
        // tên tỉnh 
        public string Name { get; set; }
        // tên phường
        public virtual ICollection<District> Districts { get; set; }
       
    }
}
