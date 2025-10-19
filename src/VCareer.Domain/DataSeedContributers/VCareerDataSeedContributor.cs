using Volo.Abp.Authorization;
using Volo.Abp.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Permission;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;

namespace VCareer.DataSeedContributers
{
    //đoạn này đang không cần thiết, cứ tạo role bằng UI
    public class VCareerDataSeedContributor : IDataSeedContributor, ITransientDependency
    {
        private readonly IdentityRoleManager _roleManager;
        private readonly Volo.Abp.PermissionManagement.IPermissionManager _permissionManager;

        public VCareerDataSeedContributor(IdentityRoleManager roleManager, Volo.Abp.PermissionManagement.IPermissionManager permissionManager)
        {
            _roleManager = roleManager;
            _permissionManager = permissionManager;
        }
        public async Task SeedAsync(DataSeedContext context)
        {
            var defaultPermissions = new[]
               {
        VCareerPermission.Files.Default,
        VCareerPermission.Files.Delete,
        VCareerPermission.Files.Download,
        VCareerPermission.Files.Update,
        VCareerPermission.Files.Upload
    };

            await SeedRoleAsync("SYSTEM_EMPLOYEE", defaultPermissions);
            await SeedRoleAsync("FINANCE_EMPLOYEE", defaultPermissions);
            await SeedRoleAsync("CUSTOMER_SUPPORT", defaultPermissions);
            await SeedRoleAsync("ACCOUNT_EMPLOYEE", defaultPermissions);
            await SeedRoleAsync("LEAD_RECRUITER", defaultPermissions);
            await SeedRoleAsync("HR_STAFF", defaultPermissions);
            await SeedRoleAsync("CANDIDATE", defaultPermissions);
        }

        private async Task SeedRoleAsync(string roleName, string[] permissions = null)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
            {
                role = new IdentityRole(Guid.NewGuid(), roleName);
                await _roleManager.CreateAsync(role);
            }

            if (permissions != null)
            {
                foreach (var permission in permissions)
                {
                    await _permissionManager.SetAsync(roleName, RolePermissionValueProvider.ProviderName, permission, true);
                }
            }

        }


    }
}
