using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.LogDto;
using VCareer.IServices.ILogService;
using VCareer.Permission;
using Volo.Abp.Application.Services;
using Volo.Abp.Auditing;
using Volo.Abp.AuditLogging;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace VCareer.Services.Logs
{
    [DisableAuditing]
    public class LogService : ApplicationService, ILogService
    {
        private readonly IRepository<AuditLog, Guid> _auditLogRepository;
        private readonly IRepository<AuditLogAction, Guid> _auditLogActionRepository;
        private readonly IdentityUserManager _userManager;

        public LogService(
            IRepository<AuditLog, Guid> auditLogRepository,
            IRepository<AuditLogAction, Guid> auditLogActionRepository,
            IdentityUserManager userManager)
        {
            _auditLogRepository = auditLogRepository;
            _auditLogActionRepository = auditLogActionRepository;
            _userManager = userManager;
        }

        [Authorize(VCareerPermission.Logging.ViewEmployeeLog)]
        public async Task<List<AuditLogDto>> GeEmployeetAuditLogsAsync(AuditLogRequestDto dto)
        {
            var employeeRoleNames = new[]
            {
                "system_employee",
                "account_employee",
                "finance_employee"
            };

            return await GetAuditLogsByRolesAsync(employeeRoleNames, dto);
        }

        [Authorize(VCareerPermission.Logging.ViewRecruiterLog)]
        public async Task<List<AuditLogDto>> GetRecruiterAuditLogsAsync(AuditLogRequestDto dto)
        {
            var recruiterRoleNames = new[]
            {
                "lead_recruiter",
                "hr_staff"
            };

            return await GetAuditLogsByRolesAsync(recruiterRoleNames, dto);
        }

        private async Task<List<AuditLogDto>> GetAuditLogsByRolesAsync(
            string[] roleNames,
            AuditLogRequestDto dto)
        {
            // 1. Lấy UserId theo role (CHUẨN ABP)
            var userIds = new List<Guid>();

            foreach (var roleName in roleNames)
            {
                var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
                userIds.AddRange(usersInRole.Select(u => u.Id));
            }

            userIds = userIds.Distinct().ToList();

            if (!userIds.Any())
            {
                return new List<AuditLogDto>();
            }

            // 2. Query AuditLog
            var query =
                from log in (await _auditLogRepository.GetQueryableAsync())
                where
                    log.UserId.HasValue
                    && userIds.Contains(log.UserId.Value)
                    && (dto.UserId == null || log.UserId == dto.UserId)
                    && (dto.StartDate == null || log.ExecutionTime >= dto.StartDate)
                    && (dto.EndDate == null || log.ExecutionTime <= dto.EndDate)
                orderby log.ExecutionTime descending
                select log;

            // 3. Map DTO
            return await query
                .Select(log => new AuditLogDto
                {
                    Id = log.Id,
                    UserId = log.UserId,
                    UserName = log.UserName,
                    HttpStatusCode = log.HttpStatusCode,
                    Exception = log.Exceptions,
                    Url = log.Url,
                    HttpMethod = log.HttpMethod,
                    BrowserInfo = log.BrowserInfo,
                    ExecutionTime = log.ExecutionTime,
                    ExecutionDuration = log.ExecutionDuration
                })
                .ToListAsync();
        }
        [Authorize(VCareerPermission.Logging.ViewActionLog)]
        public async Task<List<AuditLogActionDto>> GetAuditLogActionsAsync(Guid auditLogId)
        {
            return await (
                from action in (await _auditLogActionRepository.GetQueryableAsync())
                where action.AuditLogId == auditLogId
                orderby action.ExecutionTime
                select new AuditLogActionDto
                {
                    Id = action.Id,
                    ServiceName = action.ServiceName,
                    MethodName = action.MethodName,
                    Parameters = action.Parameters,
                    ExecutionTime = action.ExecutionTime,
                    ExecutionDuration = action.ExecutionDuration
                }
            ).ToListAsync();
        }

     }
}
