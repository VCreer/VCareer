using Org.BouncyCastle.Asn1;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.Authentication;
using VCareer.Permission;
using Volo.Abp.Authorization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace VCareer.DataSeedContributers
{
    public class VCareerDataSeedContributor : IDataSeedContributor, ITransientDependency
    {
        private readonly IdentityRoleManager _roleManager;
        private readonly IPermissionManager _permissionManager;
        private const string ACCOUNT_EMPLOYEE = "account_employee";
        private const string FINANCE_EMPLOYEE = "finance_employee";
        private const string SYSTEM_EMPLOYEE = "system_employee";
        private const string LEAD_RECRUITER = "lead_recruiter";
        private const string HR_STAFF = "hr_staff";
        private const string CANDIDATE = "candidate";

        public VCareerDataSeedContributor(IdentityRoleManager roleManager, IPermissionManager permissionManager)
        {
            _roleManager = roleManager;
            _permissionManager = permissionManager;
        }
        public async Task SeedAsync(DataSeedContext context)
        {
            await SeedRoleAsync();
            await SeedPermissionsGroupAsync(SYSTEM_EMPLOYEE, "AbpIdentity");
        }


        #region helper
        private async Task SeedRoleAsync()
        {
            foreach (var item in rolePermissionsDict)
            {
                var role = await _roleManager.FindByNameAsync(item.Key);
                if (role == null)
                {
                    role = new IdentityRole(Guid.NewGuid(), item.Key);
                    await _roleManager.CreateAsync(role);
                }

                if (item.Value != null)
                {
                    foreach (var permission in item.Value)
                    {
                        await _permissionManager.SetAsync(
                         permission,
                         RolePermissionValueProvider.ProviderName,
                         role.Name, true
);
                    }
                }
            }
        }
        // hàm này check goupname là chỉ check trong tên thằng permission có contain chữ groupname ko
        private async Task SeedPermissionsGroupAsync(string roleName, string groupName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return;

            // Lấy tất cả permission đã đăng ký
            var allPermissions = await _permissionManager.GetAllAsync(null, null);

            // Lọc permission theo group và chỉ gán được cho role (Providers chứa "R")
            var groupPermissions = allPermissions
      .Where(p => p.Name.StartsWith(groupName))
      .ToList();

            foreach (var permission in groupPermissions)
            {
                if (permission.Name.Contains("UserLookup")) continue;
                await _permissionManager.SetAsync(
                    permission.Name,
                    RolePermissionValueProvider.ProviderName,
                    role.Name,
                    true
                );
            }
        }


        #endregion

        private readonly Dictionary<string, string[]> rolePermissionsDict = new Dictionary<string, string[]>()
        {
            //candidate
            { CANDIDATE, FilePermissions },

            //recruiter
            { LEAD_RECRUITER, FilePermissions },
             { HR_STAFF, FilePermissions },

             //employee
            { SYSTEM_EMPLOYEE, FilePermissions },
            { FINANCE_EMPLOYEE, FilePermissions },
            { ACCOUNT_EMPLOYEE, FilePermissions },


        };

        #region  group Permission

        private static string[] FilePermissions = new[]
      {
        VCareerPermission.Files.Default,
        VCareerPermission.Files.View,
        VCareerPermission.Files.Delete,
        VCareerPermission.Files.Download,
        VCareerPermission.Files.Update,
        VCareerPermission.Files.Upload
        };


        #endregion 

    }
}
