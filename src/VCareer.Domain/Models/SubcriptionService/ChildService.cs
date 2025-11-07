using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.SubcriptionService
{
    public class ChildService:FullAuditedAggregateRoot<Guid>
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public bool IsLifeTime{ get; set; } = false;
        public int DayDuration { get; set; }
        public bool shouldLimited { get; set; } 


    }
}
