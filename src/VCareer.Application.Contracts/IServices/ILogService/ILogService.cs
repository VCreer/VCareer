using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.LogDto;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.ILogService
{
    public interface ILogService : IApplicationService
    {
        public Task<List<AuditLogDto>> GeEmployeetAuditLogsAsync(AuditLogRequestDto dto);
        public Task<List<AuditLogDto>> GetRecruiterAuditLogsAsync(AuditLogRequestDto dto);
        public Task<List<AuditLogActionDto>> GetAuditLogActionsAsync(Guid auditLogId);
    }
}
