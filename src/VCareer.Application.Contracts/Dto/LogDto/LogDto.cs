using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.LogDto
{
    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string UserName { get; set; }
        public string RoleName { get; set; }

        public int? HttpStatusCode { get; set; }
        public string Exception { get; set; }
        public string Url { get; set; }
        public string HttpMethod { get; set; }
        public string BrowserInfo { get; set; }

        public DateTime ExecutionTime { get; set; }
        public int ExecutionDuration { get; set; }
    }
    public class AuditLogActionDto
    {
        public Guid Id { get; set; }
        public string ServiceName { get; set; }
        public string MethodName { get; set; }
        public string Parameters { get; set; }

        public DateTime ExecutionTime { get; set; }
        public int ExecutionDuration { get; set; }
    }

    public class AuditLogRequestDto
    {
        public Guid? UserId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }


}
