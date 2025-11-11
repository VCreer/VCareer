using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Identity;
using Volo.Abp.Security.Claims;

namespace VCareer.Token
{

    public class CustomUserClaimsPrincipalFactory : AbpUserClaimsPrincipalFactory
    {
        public CustomUserClaimsPrincipalFactory(
            UserManager<Volo.Abp.Identity.IdentityUser> userManager,
            RoleManager<Volo.Abp.Identity.IdentityRole> roleManager,
            IOptions<IdentityOptions> options,
            ICurrentPrincipalAccessor currentPrincipalAccessor,
            IAbpClaimsPrincipalFactory abpClaimsPrincipalFactory)
            : base(userManager, roleManager, options, currentPrincipalAccessor, abpClaimsPrincipalFactory)
        {
        }

        protected override async Task<ClaimsIdentity> GenerateClaimsAsync(Volo.Abp.Identity.IdentityUser user)
        {
            var identity = await base.GenerateClaimsAsync(user);

        
          /*  identity.AddClaim(new Claim(AbpClaimTypes.Role, role));*/

            return identity;
        }
    }

}

