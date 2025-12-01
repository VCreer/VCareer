using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.IRepositories.Profile;
using VCareer.IServices.User;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;


namespace VCareer.Services.User
{

    public class UserService : ApplicationService, IUserIdentifyService
    {
        private readonly IdentityUserAppService _userAppService;
        private readonly IdentityRoleAppService _roleAppService;
        private readonly IPermissionAppService _permissionAppService;
        private readonly IPermissionDefinitionManager _permissionDefinitionManager;
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly ICandidateProfileRepository _candidateProfileRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IStringLocalizerFactory _stringLocalizerFactory;

        public UserService(
            IdentityUserAppService userAppService,
            IdentityRoleAppService roleAppService,
            IPermissionAppService permissionAppService,
            IRecruiterRepository recruiterRepository,
            ICandidateProfileRepository candidateProfileRepository,
            IEmployeeRepository employeeRepository,
            IPermissionDefinitionManager permissionDefinitionManager,
            IStringLocalizerFactory stringLocalizerFactory
            )
        {
            _userAppService = userAppService;
            _roleAppService = roleAppService;
            _permissionAppService = permissionAppService;
            _recruiterRepository = recruiterRepository;
            _candidateProfileRepository = candidateProfileRepository;
            _employeeRepository = employeeRepository;
            _permissionDefinitionManager = permissionDefinitionManager;
            _stringLocalizerFactory = stringLocalizerFactory;

        }

        public async Task<List<string>> GetRolesByUserIdAsync(Guid userId)
        {
            var user = await _userAppService.GetAsync(userId);
            if (user == null) throw new BusinessException("User not found");
            var result = await _userAppService.GetRolesAsync(userId);
            return result.Items.Select(x => x.Name).ToList();
        }
        public async Task UpdateUserRolesAsync(Guid userId, List<string> roleNames)
        {
            var user = await _userAppService.GetAsync(userId);
            if (user == null) throw new BusinessException("User not found");
            await _userAppService.UpdateRolesAsync(
                userId,
                new IdentityUserUpdateRolesDto
                {
                    RoleNames = roleNames.ToArray()
                }
            );
        }
        public async Task<List<Guid>> GetUsersIdByRoleAsync(int roleType)
        {
            if (!Enum.TryParse(roleType.ToString(), out RoleType role)) return new List<Guid> { Guid.Empty };
            switch (role)
            {
                case RoleType.Employee:
                    var employees = await _employeeRepository.GetListAsync();
                    return employees.Select(x => x.UserId).ToList();
                case RoleType.Recruiter:
                    var recruiter = await _recruiterRepository.GetListAsync();
                    return recruiter.Select(x => x.UserId).ToList();
                case RoleType.Candidate:
                    var candidate = await _candidateProfileRepository.GetListAsync();
                    return candidate.Select(x => x.UserId).ToList();
                default:
                    return new List<Guid> { Guid.Empty };
            }

        }
        public async Task SetUserActiveStatusAsync(Guid userId, bool isActive)
        {
            var user = await _userAppService.GetAsync(userId);
            if (user == null) throw new BusinessException("User not found");
          
            await _userAppService.UpdateAsync(userId, new IdentityUserUpdateDto
            {
                IsActive = isActive
            });
        }
        public async Task<List<IdentityRoleDto>> GetAllRolesAsync()
        {
            var roles = await _roleAppService.GetListAsync(new GetIdentityRolesInput());
            return roles.Items.ToList();
        }
        public async Task<List<IdentityRoleDto>> GetAllEmployeeRolesAsync()
        {
            var roles = await _roleAppService.GetListAsync(new GetIdentityRolesInput());
            return roles.Items.Where(r => r.Name.Contains("employee", StringComparison.OrdinalIgnoreCase)).ToList();
        }
        public async Task<List<PermissionGroupDto>> GetAllPermissionGroupsAsync()
        {
            var groups = await _permissionDefinitionManager.GetGroupsAsync();
            if(groups==null) return new List<PermissionGroupDto>();

            return groups.Select(group => new PermissionGroupDto
            {
                Name = group.Name,
                DisplayName = group.DisplayName?.Localize(_stringLocalizerFactory),
                Permissions = group.Permissions.Select(p => new PermissionGrantInfoDto
                {
                    Name = p.Name,
                    DisplayName = p.DisplayName?.Localize(_stringLocalizerFactory)
                }).ToList()
            }).ToList();
        }
        public async Task<List<PermissionGroupDto>> GetPermissionGroupsByRoleAsync(Guid roleId)
        {
            var role = await _roleAppService.GetAsync(roleId);
            if (role == null) throw new BusinessException("Role not found");
            var result = await _permissionAppService.GetAsync(
                providerName: "R",      // PermissionValueProviderNames.Role
                providerKey: roleId.ToString()
            );

            return result.Groups;
        }
        public async Task<List<PermissionGroupDto>> GetPermissionGroupsByUserAsync(Guid userId)
        {
            var user = await _userAppService.GetAsync(userId);
            if (user == null) throw new BusinessException("User not found");
            var result = await _permissionAppService.GetAsync(
                providerName: "U",      // PermissionValueProviderNames.User
                providerKey: userId.ToString()
            );

            return result.Groups;
        }
        public async Task UpdateRolePermissionsAsync(string roleName, List<string> permissions)
        {
            if(permissions==null || permissions.Count==0) return;
            var input = new UpdatePermissionsDto
            {
                Permissions = permissions.Select(p => new UpdatePermissionDto
                {
                    Name = p,
                    IsGranted = true
                }).ToArray()
            };

            await _permissionAppService.UpdateAsync(
                providerName: "R",   // Role provider
                providerKey: roleName,
                input
            );
        }
        public async Task UpdateUserPermissionsAsync(Guid userId, List<string> desiredPermissions)
        {
            var user = await _userAppService.GetAsync(userId);
            if (user == null) throw new BusinessException("User not found");

            var currentPermissionsResult = await _permissionAppService.GetAsync(
                providerName: "U",
                providerKey: userId.ToString()
            );

            // Lấy tất cả permission của user đang được grant
            var currentGranted = currentPermissionsResult.Groups
                .SelectMany(g => g.Permissions)
                .Where(p => p.IsGranted)
                .Select(p => p.Name)
                .ToList();

            // Tạo danh sách UpdatePermissionDto
            var updateList = new List<UpdatePermissionDto>();

            // Grant những permission mới có trong desiredPermissions nhưng chưa grant
            var toGrant = desiredPermissions.Except(currentGranted);
            updateList.AddRange(toGrant.Select(p => new UpdatePermissionDto
            {
                Name = p,
                IsGranted = true
            }));

            // Revoke những permission hiện có nhưng không còn trong desiredPermissions
            var toRevoke = currentGranted.Except(desiredPermissions);
            updateList.AddRange(toRevoke.Select(p => new UpdatePermissionDto
            {
                Name = p,
                IsGranted = false
            }));

            // Cập nhật permissions
            if (updateList.Any())
            {
                await _permissionAppService.UpdateAsync(
                    providerName: "U",
                    providerKey: userId.ToString(),
                    new UpdatePermissionsDto
                    {
                        Permissions = updateList.ToArray()
                    }
                );
            }
        }

    }
}
