using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.Identity;

namespace VCareer.Models.Users
{
    public class EmployeeProfile : FullAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }
        public string Department { get; set; }
        public string Description { get; set; }
        public bool IsSuperAdmin { get; set; }
        public bool Status { get; set; }
        public IdentityUser User { get; set; }
    }
}
