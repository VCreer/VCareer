using System;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.Uow;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.SqlServer;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.BlobStoring.Database.EntityFrameworkCore;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using Volo.Abp.Studio;
// 🔧 Thêm using cho custom repositories
using VCareer.Repositories.Job;
using VCareer.Repositories;

namespace VCareer.EntityFrameworkCore;

[DependsOn(
    typeof(VCareerDomainModule),
    typeof(AbpPermissionManagementEntityFrameworkCoreModule),
    typeof(AbpSettingManagementEntityFrameworkCoreModule),
    typeof(AbpEntityFrameworkCoreSqlServerModule),
    typeof(AbpBackgroundJobsEntityFrameworkCoreModule),
    typeof(AbpAuditLoggingEntityFrameworkCoreModule),
    typeof(AbpFeatureManagementEntityFrameworkCoreModule),
    typeof(AbpIdentityEntityFrameworkCoreModule),
    typeof(AbpOpenIddictEntityFrameworkCoreModule),
    typeof(AbpTenantManagementEntityFrameworkCoreModule),
    typeof(BlobStoringDatabaseEntityFrameworkCoreModule)
    )]
public class VCareerEntityFrameworkCoreModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {

        VCareerEfCoreEntityExtensionMappings.Configure();
    }

    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddAbpDbContext<VCareerDbContext>(options =>
        {
                /* Remove "includeAllEntities: true" to create
                 * default repositories only for aggregate roots */
            options.AddDefaultRepositories(includeAllEntities: true);
            
            // ==========================================
            // 🔧 ĐĂNG KÝ CUSTOM REPOSITORIES cho ABP (Manual)
            // ==========================================
            // ABP chỉ tự động đăng ký default repositories
            // Custom repository implementations phải đăng ký thủ công
            
            // Repository cho Location (Province & District)
            options.AddRepository<VCareer.Models.Job.Province, VCareer.Repositories.Job.LocationRepository>();
            options.AddRepository<VCareer.Models.Job.District, VCareer.Repositories.Job.DistrictRepository>();
            
            // Repository cho Job Category
            options.AddRepository<VCareer.Models.Job.Job_Category, VCareer.Repositories.Job.JobCategoryRepository>();
        });
        
        // ==========================================
        // 🔧 ĐĂNG KÝ CUSTOM REPOSITORY INTERFACES (DI Container)
        // ==========================================
        // ⚠️ QUAN TRỌNG: options.AddRepository<> ở trên chỉ đăng ký cho ABP Repository pattern
        // PHẢI đăng ký thêm interface → implementation cho DI container
        // Nếu không, khi inject ILocationRepository sẽ bị lỗi 500!
        
        context.Services.AddTransient<ILocationRepository, LocationRepository>();
        context.Services.AddTransient<IDistrictRepository, DistrictRepository>();
        context.Services.AddTransient<IJobCategoryRepository, JobCategoryRepository>();

        if (AbpStudioAnalyzeHelper.IsInAnalyzeMode)
        {
            return;
        }

        Configure<AbpDbContextOptions>(options =>
        {
            /* The main point to change your DBMS.
             * See also VCareerDbContextFactory for EF Core tooling. */

            options.UseSqlServer();

        });
        
    }
}
