using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities.Auditing;

namespace VCareer.Models.IpAddress
{
    public class IpAddress : AuditedAggregateRoot<int>
    {
        public string Description { get; set; }
        public string Ip { get; set;}
        public  ICollection<EmployeeIpAddress> EmployeeIpAdresses { get; set; }
      
    }
}
