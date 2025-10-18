using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Security.Claims;
using Volo.Abp.Users;

namespace VCareer.Security
{
    public class CustomCurrentUser : CurrentUser
    {
        public CustomCurrentUser(ICurrentPrincipalAccessor principalAccessor) : base(principalAccessor)
        {
        }

        public string Department => FindClaim("Department").Value;
    }
}
