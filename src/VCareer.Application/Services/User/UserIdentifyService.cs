using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants;
using VCareer.Dto.UserDto;
using VCareer.IRepositories.Profile;
using VCareer.IServices.User;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.Uow;
using Volo.Abp.Users;


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
        private readonly IIdentityRoleRepository _identityRoleRepository;
        private readonly IPermissionManager _permissionManager;

        public UserService(
            IdentityUserAppService userAppService,
            IdentityRoleAppService roleAppService,
            IPermissionAppService permissionAppService,
            IRecruiterRepository recruiterRepository,
            ICandidateProfileRepository candidateProfileRepository,
            IEmployeeRepository employeeRepository,
            IIdentityRoleRepository identityRoleRepository,
            IPermissionDefinitionManager permissionDefinitionManager,
            IPermissionManager permissionManager,
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
            _identityRoleRepository= _identityRoleRepository;
            _permissionManager = permissionManager;

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
        [Authorize(VCareerPermission.User.ViewByRole)]
        public async Task<List<IdentityUserDto>> GetUsersInfoByRoleAsync(int roleType)
        {
            if (!Enum.IsDefined(typeof(RoleType), roleType))
                return new List<IdentityUserDto>();

            var role = (RoleType)roleType;

            List<Guid> listUserId = role switch
            {
                RoleType.Employee =>
                    (await _employeeRepository.GetListAsync()).Select(x => x.UserId).ToList(),

                RoleType.Recruiter =>
                    (await _recruiterRepository.GetListAsync()).Select(x => x.UserId).ToList(),

                RoleType.Candidate =>
                    (await _candidateProfileRepository.GetListAsync()).Select(x => x.UserId).ToList(),

                _ => new List<Guid>()
            };

            if (!listUserId.Any())
                return new List<IdentityUserDto>();

            var users = new List<IdentityUserDto>();

            foreach (var id in listUserId)
            {
                var user = await _userAppService.GetAsync(id);
                users.Add(user);
            }

            return users;
        }
        [Authorize(VCareerPermission.User.SetStatus)]
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
            return roles.Items.Except(roles.Items.Where(r => r.Name.Contains("admin", StringComparison.OrdinalIgnoreCase))).ToList();
        }
        [Authorize(VCareerPermission.User.ViewEmployees)]
        public async Task<List<IdentityRoleDto>> GetAllEmployeeRolesAsync()
        {
            var roles = await _roleAppService.GetListAsync(new GetIdentityRolesInput());
            return roles.Items.Where(r => r.Name.Contains("employee", StringComparison.OrdinalIgnoreCase)).ToList();
        }
        public async Task<List<PermissionGroupDto>> GetAllPermissionGroupsAsync()
        {
            var groups = await _permissionDefinitionManager.GetGroupsAsync();
            if (groups == null) return new List<PermissionGroupDto>();

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

            // FIX: Sử dụng role.Name thay vì roleId, và "Role" thay vì "R"
            var result = await _permissionAppService.GetAsync(
                providerName: RolePermissionValueProvider.ProviderName, // Hoặc "Role"
                providerKey: role.Name  // Dùng Name thay vì Id
            );

            var excludedGroups = new[]
            {
        "Book_Test_Permissions",
        "AbpTenantManagement",
        "SettingManagement",
        "FeatureManagement"
    };

            return result.Groups
                         .Where(g => !excludedGroups.Contains(g.Name))
                         .ToList();
        }

        public async Task<List<PermissionGrantInfoDto>> GetPermissionsByRoleAndGroupAsync(
            Guid roleId,
            string groupName)
        {
            var role = await _roleAppService.GetAsync(roleId);
            if (role == null)
                throw new BusinessException("Role not found");

            // FIX: Sử dụng role.Name thay vì roleId, và "Role" thay vì "R"
            var result = await _permissionAppService.GetAsync(
                providerName: RolePermissionValueProvider.ProviderName, // Hoặc "Role"
                providerKey: role.Name  // Dùng Name thay vì Id
            );

            var targetGroup = result.Groups.FirstOrDefault(g => g.Name == groupName);
            if (targetGroup == null)
                return new List<PermissionGrantInfoDto>();

            return targetGroup.Permissions.ToList();
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
        [Authorize]
        [Authorize]
        public async Task UpdateRolePermissionsAsync(string roleName, List<string> permissions)
        {
            using (var uow = UnitOfWorkManager.Begin(requiresNew: true, isTransactional: true))
            {
                try
                {
                    // Validate role
                    var roleList = await _roleAppService.GetListAsync(new GetIdentityRolesInput());
                    var role = roleList.Items.FirstOrDefault(r => r.Name == roleName);
                    if (role == null)
                    {
                        throw new UserFriendlyException($"Vai trò '{roleName}' không tồn tại");
                    }

                    // BƯỚC 1: Xóa TẤT CẢ permissions hiện tại của role này
                    // Lấy tất cả permission grants của role
                    var currentGrants = await _permissionManager.GetAllAsync(
                        RolePermissionValueProvider.ProviderName,
                        roleName
                    );

                    // Delete tất cả grants hiện tại
                    foreach (var grant in currentGrants)
                    {
                        try
                        {
                            await _permissionManager.DeleteAsync(
                                grant.Name,
                                RolePermissionValueProvider.ProviderName
                                
                            );
                        }
                        catch
                        {
                            // Ignore delete errors
                        }
                    }

                    // Save changes sau khi delete
                    await uow.SaveChangesAsync();

                    // BƯỚC 2: Thêm lại permissions mới
                    var desiredSet = (permissions ?? new List<string>()).ToHashSet();

                    foreach (var permissionName in desiredSet)
                    {
                        try
                        {
                            await _permissionManager.SetAsync(
                                permissionName,
                                RolePermissionValueProvider.ProviderName,
                                roleName,
                                true
                            );
                        }
                        catch (Exception ex)
                        {
                            Logger.LogWarning($"Failed to grant permission {permissionName}: {ex.Message}");
                        }
                    }

                    // Complete UnitOfWork
                    await uow.CompleteAsync();
                }
                catch (UserFriendlyException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, $"Error updating role permissions for {roleName}");
                    throw new UserFriendlyException("Không thể cập nhật quyền. Vui lòng thử lại.");
                }
            }
        }

        public async Task UpdateUserPermissionsAsync(Guid userId, List<string> desiredPermissions)
        {
            try
            {
                var user = await _userAppService.GetAsync(userId);
                if (user == null) throw new BusinessException("User not found");

                var currentPermissionsResult = await _permissionAppService.GetAsync(
                    providerName: UserPermissionValueProvider.ProviderName, // "User"
                    providerKey: userId.ToString()
                );

                // Lấy tất cả permission của user đang được grant
                var currentGranted = currentPermissionsResult.Groups
                    .SelectMany(g => g.Permissions)
                    .Where(p => p.IsGranted)
                    .Select(p => p.Name)
                    .ToHashSet();

                // Lấy tất cả permissions có sẵn
                var allAvailablePermissions = currentPermissionsResult.Groups
                    .SelectMany(g => g.Permissions)
                    .Select(p => p.Name)
                    .ToHashSet();

                var updateList = new List<UpdatePermissionDto>();
                var desiredSet = (desiredPermissions ?? new List<string>()).ToHashSet();

                // Grant những permission mới
                foreach (var permission in desiredSet)
                {
                    if (allAvailablePermissions.Contains(permission))
                    {
                        updateList.Add(new UpdatePermissionDto
                        {
                            Name = permission,
                            IsGranted = true
                        });
                    }
                }

                // Revoke những permission không còn trong danh sách
                var toRevoke = currentGranted.Except(desiredSet);
                foreach (var permission in toRevoke)
                {
                    updateList.Add(new UpdatePermissionDto
                    {
                        Name = permission,
                        IsGranted = false
                    });
                }

                // Cập nhật permissions
                if (updateList.Any())
                {
                    await _permissionAppService.UpdateAsync(
                        providerName: UserPermissionValueProvider.ProviderName, // "User"
                        providerKey: userId.ToString(),
                        new UpdatePermissionsDto
                        {
                            Permissions = updateList.ToArray()
                        }
                    );
                }
            }
            catch (Exception ex)
            {
                throw new BusinessException($"Failed to update user permissions: {ex.Message}");
            }
        }

    }
}
