using Microsoft.Extensions.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.Dto.UserDto;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;

namespace VCareer.IServices.User
{
    public interface IUserIdentifyService : IApplicationService
    {
        public Task<List<string>> GetRolesByUserIdAsync(Guid userId);
        public Task UpdateUserRolesAsync(Guid userId, List<string> roleNames);
        public Task<List<IdentityUserDto>> GetUsersInfoByRoleAsync(int roleType);
        public Task SetUserActiveStatusAsync(Guid userId, bool isActive);
        public Task<List<IdentityRoleDto>> GetAllRolesAsync();
        public Task<List<IdentityRoleDto>> GetAllEmployeeRolesAsync();
        public Task<List<PermissionGroupDto>> GetAllPermissionGroupsAsync();
        public Task<List<PermissionGroupDto>> GetPermissionGroupsByRoleAsync(Guid roleId);
        public Task<List<PermissionGroupDto>> GetPermissionGroupsByUserAsync(Guid userId);
        public Task UpdateRolePermissionsAsync(string roleName, List<string> permissions);
        public Task UpdateUserPermissionsAsync(Guid userId, List<string> desiredPermissions);


    }
}


