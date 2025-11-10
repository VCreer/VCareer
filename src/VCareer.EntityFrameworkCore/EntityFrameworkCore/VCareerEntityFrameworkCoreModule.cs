using Microsoft.Extensions.DependencyInjection;
using System;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.Models.Users;
// 🔧 Thêm using cho custom repositories
using VCareer.Repositories.Job;
using VCareer.Repositories.Profile;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.BlobStoring.Database.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.SqlServer;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.Modularity;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.Studio;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using Volo.Abp.Uow;

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
            options.AddRepository<VCareer.Models.Job.Job_Category, VCareer.Repositories.Job.JobCategoryRepository>();
            options.AddRepository<VCareer.Models.Job.Job_Post, VCareer.Repositories.Job.JobPostRepository>();
            options.AddRepository<CandidateProfile, CandidateRepository>();
            options.AddRepository<RecruiterProfile, RecruiterProfileRepository>();
        });


        context.Services.AddTransient<IJobCategoryRepository, JobCategoryRepository>();
        context.Services.AddTransient<IJobSearchRepository, JobPostRepository>();
        context.Services.AddTransient<ICandidateProfileRepository, CandidateRepository>();
        context.Services.AddTransient<IRecruiterRepository, RecruiterProfileRepository>();

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
