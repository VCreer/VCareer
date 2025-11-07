using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using VCareer.Localization;
using VCareer.MultiTenancy;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.MultiTenancy;
using Volo.Abp.PermissionManagement.Identity;
using Volo.Abp.SettingManagement;
using Volo.Abp.BlobStoring.Database;
using Volo.Abp.Caching;
using Volo.Abp.OpenIddict;
using Volo.Abp.PermissionManagement.OpenIddict;
using Volo.Abp.AuditLogging;
using Volo.Abp.BackgroundJobs;
using Volo.Abp.Emailing;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.TenantManagement;
using Volo.Abp.MailKit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;


namespace VCareer;

[DependsOn(
    typeof(VCareerDomainSharedModule),
    typeof(AbpAuditLoggingDomainModule),
    typeof(AbpCachingModule),
    typeof(AbpBackgroundJobsDomainModule),
    typeof(AbpFeatureManagementDomainModule),
    typeof(AbpPermissionManagementDomainIdentityModule),
    typeof(AbpPermissionManagementDomainOpenIddictModule),
    typeof(AbpSettingManagementDomainModule),
    typeof(AbpIdentityDomainModule),
    typeof(AbpOpenIddictDomainModule),
    typeof(AbpTenantManagementDomainModule),
    typeof(BlobStoringDatabaseDomainModule),
    typeof(AbpEmailingModule),
    typeof(AbpMailKitModule)

     )]
public class VCareerDomainModule : AbpModule
{

    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        var _configuration = context.Services.GetConfiguration();
        var lockoutConfig = _configuration.GetSection("Identity:Lockout");

        Configure<AbpMultiTenancyOptions>(options =>
        {
            options.IsEnabled = MultiTenancyConsts.IsEnabled;
        });

        //cấu hình phần liên quan đến lock tài khoản
        Configure<IdentityOptions>(options =>
        {
            options.Lockout.AllowedForNewUsers = lockoutConfig.GetValue("AllowedForNewUsers", true);
            options.Lockout.MaxFailedAccessAttempts = lockoutConfig.GetValue("MaxFailedAccessAttempts", 5);
            options.Lockout.DefaultLockoutTimeSpan = lockoutConfig.GetValue("DefaultLockoutTimeSpan", TimeSpan.FromMinutes(10));
        });
        ConfigureCustomClaimsPrincipalFactory(context);



        // đây là đoạn code sẽ chạy nếu dự án đang trong quá trình debug 
        //đoạn dưới là nếu đang trong quá trình debug mặc định sẽ ko gửi mail mà sẽ gửi log bằng nullEmailSender
#if DEBUG
        //  context.Services.Replace(ServiceDescriptor.Singleton<IEmailSender, NullEmailSender>());
#endif
    }

    //conffig  để custom cái tạo claims trong  abpuserClaimsPrincipalFactory
    private void ConfigureCustomClaimsPrincipalFactory(ServiceConfigurationContext context)
    {
        context.Services.Replace(
            ServiceDescriptor.Transient<IUserClaimsPrincipalFactory<Volo.Abp.Identity.IdentityUser>, Token.CustomUserClaimsPrincipalFactory>()
        );
    }
}
