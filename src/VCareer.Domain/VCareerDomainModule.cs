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
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.TenantManagement;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;
using Volo.Abp.MailKit;
using MailKit.Security;


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
    typeof(BlobStoringDatabaseDomainModule)

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
            
            // Cấu hình password validation - tắt các yêu cầu chữ hoa, thường, số và ký tự đặc biệt
           
        });
        ConfigureCustomClaimsPrincipalFactory(context);



        // Cấu hình MailKit để xử lý SSL/TLS đúng cách
        Configure<AbpMailKitOptions>(options =>
        {
            var smtpPort = _configuration.GetValue<int>("Settings:Abp.Mailing.Smtp.Port", 587);
            var enableSsl = _configuration.GetValue<bool>("Settings:Abp.Mailing.Smtp.EnableSsl", true);
            
            // Port 465 sử dụng SSL/TLS từ đầu (implicit SSL)
            // Port 587 sử dụng STARTTLS (plain-text rồi nâng cấp lên TLS)
            if (smtpPort == 465)
            {
                options.SecureSocketOption = SecureSocketOptions.SslOnConnect;
            }
            else if (smtpPort == 587 && enableSsl)
            {
                options.SecureSocketOption = SecureSocketOptions.StartTls;
            }
            else
            {
                options.SecureSocketOption = SecureSocketOptions.None;
            }
        });

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
