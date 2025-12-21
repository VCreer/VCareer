using Localization.Resources.AbpUi;
using VCareer.Localization;
using VCareer.Filters;
using Volo.Abp.Account;
using Volo.Abp.SettingManagement;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement.HttpApi;
using Volo.Abp.Localization;
using Volo.Abp.TenantManagement;
using Microsoft.Extensions.DependencyInjection;

namespace VCareer;

 [DependsOn(
    typeof(VCareerApplicationContractsModule),
    typeof(AbpPermissionManagementHttpApiModule),
    typeof(AbpSettingManagementHttpApiModule),
    typeof(AbpAccountHttpApiModule),
    typeof(AbpIdentityHttpApiModule),
    typeof(AbpTenantManagementHttpApiModule),
    typeof(AbpFeatureManagementHttpApiModule)
    )]
public class VCareerHttpApiModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        ConfigureLocalization();
        
        // Đăng ký exception filter để xử lý concurrency exception
        context.Services.AddMvc(options =>
        {
            options.Filters.Add<ConcurrencyExceptionFilter>();
        });
    }

    private void ConfigureLocalization()
    {
        Configure<AbpLocalizationOptions>(options =>
        {
            options.Resources
                .Get<VCareerResource>()
                .AddBaseTypes(
                    typeof(AbpUiResource)
                );
        });
    }
}
