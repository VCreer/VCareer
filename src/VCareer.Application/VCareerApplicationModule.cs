using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VCareer.IServices.IJobServices;
using VCareer.Jwt;
using VCareer.Repositories.Job;
using VCareer.Security;
using VCareer.Services.Job.JobPosting.Services;
using VCareer.Services.Job.Search;
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

        var conf = context.Services.GetConfiguration();
        // context.Services.AddScoped<ILocationService, LocationAppService>();

        //  ConfigureClaims(); // đang chưa làm rõ logic claims động

        // 🔧 ĐĂNG KÝ LUCENE INDEXER (Singleton - chỉ 1 instance duy nhất)
        // ISingletonDependency đã được implement trong LuceneJobIndexer
        // ABP tự động đăng ký, nhưng ta có thể đăng ký thủ công để rõ ràng:
        context.Services.AddSingleton<ILuceneJobIndexer, LuceneJobIndexer>();

        // 🔧 ĐĂNG KÝ JOB POSTING APP SERVICE (Transient - mỗi request 1 instance mới)
        context.Services.AddSingleton<VCareer.Job.JobPosting.ISerices.IJobPostingAppService, JobPostingAppService>();
        context.Services.AddSingleton<IJobCategoryAppService, JobCategoryAppService>();
        context.Services.AddSingleton<ILocationService, LocationAppService>();
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
