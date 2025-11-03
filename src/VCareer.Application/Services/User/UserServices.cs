using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;

namespace VCareer.Services.User
{
    [Dependency(ReplaceServices = true)]
    [ExposeServices(typeof(IIdentityUserAppService), IncludeSelf = true)]
    public class UserServices : IdentityUserAppService, IIdentityUserAppService, ITransientDependency
    {
        public UserServices(
            IdentityUserManager userManager,
            IIdentityUserRepository userRepository,
            IIdentityRoleRepository roleRepository, 
            IOptions<IdentityOptions> identityOptions,
            IPermissionChecker permissionChecker) 
            : base(userManager, userRepository, roleRepository, identityOptions, permissionChecker)
        {
        }

     /*   public override async Task<>*/
    }
}
