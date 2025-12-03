using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Linq;
using VCareer.Application.Applications;
using VCareer.IServices.Application;
using VCareer.IServices.IJobServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using VCareer.IServices.IJobServices;
using VCareer.Jwt;
using VCareer.Security;
using VCareer.Services.Job;
using VCareer.Services.LuceneService.JobSearch;
using VCareer.Services.Payment;
using VCareer.Token;
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
using VNPAY;
using System.Linq;

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

        var conf = context.Services.GetConfiguration();
        // context.Services.AddScoped<ILocationService, LocationAppService>();

        // 🔧 ĐĂNG KÝ LUCENE INDEXER (Singleton - chỉ 1 instance duy nhất)
        // ISingletonDependency đã được implement trong LuceneJobIndexer
        // ABP tự động đăng ký, nhưng ta có thể đăng ký thủ công để rõ ràng:
        context.Services.AddSingleton<ILuceneJobIndexer, LuceneJobIndexer>();

        // 🔧 ĐĂNG KÝ VNPAY CLIENT được thực hiện trong VCareerHttpApiHostModule
        // để có access đến IConfiguration

        // 🔧 ĐĂNG KÝ VNPAY SERVICE
        context.Services.AddScoped<IVnpayService, VnpayService>();
                      }

   

}
