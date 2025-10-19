using Microsoft.Extensions.Configuration;
using VCareer.Jwt;
using VCareer.Security;
using Volo.Abp.Account;
using Volo.Abp.AutoMapper;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.Security.Claims;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;
using Volo.Abp.Users;

namespace VCareer;

[DependsOn(
    typeof(VCareerDomainModule),
    typeof(VCareerApplicationContractsModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpAccountApplicationModule),
    typeof(AbpTenantManagementApplicationModule),
    typeof(Volo.Abp.Identity.AspNetCore.AbpIdentityAspNetCoreModule), //tu them 
    typeof(AbpSettingManagementApplicationModule)
    )]
public class VCareerApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpAutoMapperOptions>(options =>
        {
            options.AddMaps<VCareerApplicationModule>();
        });
        //  ConfigureClaims(); // đang chưa làm rõ logic claims động

    }
    private void ConfigureClaims()
    {
        // đăng kí claims contributer
        Configure<AbpClaimsPrincipalFactoryOptions>(options =>
        {
            options.Contributors.Add<VCareerClaimContributer>();
        });
    }
}
