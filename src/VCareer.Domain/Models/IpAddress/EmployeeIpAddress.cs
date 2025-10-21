using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.IpAddress
{
    public class EmployeeIpAddress : AuditedAggregateRoot<int>
    {
        public int IpAdressId { get; set; }
        public Guid EmployeeId { get; set; }
        public IpAddress IpAddress { get; set; }
        public EmployeeProfile EmployeeProfile { get; set; }
    }
}
