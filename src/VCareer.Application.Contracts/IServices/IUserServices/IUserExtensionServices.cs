using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.UserExtensionDto;
using Volo.Abp.Identity;

namespace VCareer.IServices.IUserServices
{
    public interface IUserExtensionServices
    {
        public Task ForgeLogOutUserAllDeviceAsync(ForgeLogoutDto input);
        public Task<IdentityUser> CreateEmployeeAccountAsync();
        public Task<IdentityUser> CreateHrStaffAccountAsync();
        public  Task SetAccountActiveStatusAsync(SetAccountActiveStatusDto input);
        public  Task SetAccountLockStatusAsync(SetAccountActiveStatusDto input);
        public Task SetIpAddressAsync(IpAddressDto input);

    }
}
