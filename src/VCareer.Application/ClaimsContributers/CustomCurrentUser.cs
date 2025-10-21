using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Security.Claims;
using Volo.Abp.Users;

namespace VCareer.Security
{
    //class này để custom user để thêm các trường động vào claims rồi sau đố có thể truy xuất ra mà ko cần tạo thêm  cột
    public class CustomCurrentUser // : CurrentUser
    {
     /*   public CustomCurrentUser(ICurrentPrincipalAccessor principalAccessor)
            : base(principalAccessor)
        {
        }*/

        //đây chỉ là để làm mẫu , cách dùng :CurrentUser.Department.
   //     public string? Department => FindClaim("Department")?.Value;
    }

}
