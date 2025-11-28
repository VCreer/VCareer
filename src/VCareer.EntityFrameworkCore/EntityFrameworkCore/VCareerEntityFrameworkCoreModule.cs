using Microsoft.Extensions.DependencyInjection;
using System;
using VCareer.IRepositories.Category;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Payment;
using VCareer.IRepositories.Profile;
using VCareer.IRepositories.Subcriptions;
using VCareer.IRepositories.Cart;
using VCareer.Models.Job;
using VCareer.Models.JobCategory;
using VCareer.Models.Subcription;
using VCareer.Models.Subcription_Payment;
using VCareer.Models.Users;
using VCareer.Repositories.Category;

// 🔧 Thêm using cho custom repositories
using VCareer.Repositories.Job;
using VCareer.Repositories.Profile;
using VCareer.Repositories.Subcription_Payment;
using VCareer.Repositories.Subcriptions;
using VCareer.Repositories.Cart;
using CartEntity = VCareer.Models.Cart.Cart;
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
using VCareer.Models.Applications;

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
            options.AddRepository<CandidateProfile, CandidateRepository>();
            options.AddRepository<RecruiterProfile, RecruiterProfileRepository>();
            options.AddRepository<EmployeeProfile, EmployeeProfileRepository>();
            options.AddRepository<VCareer.Models.Job.Job_Post, JobPostRepository>();
            options.AddRepository<RecruitmentCampaign, RecruitmentCampainRepository>();

            options.AddRepository<Tag, TagRepository>();
            options.AddRepository<Categoty_Tag, TagRepository>();
            options.AddRepository<Job_Category, JobCategoryRepository>();
            options.AddRepository<JobTag, JobTagRepository>();

            options.AddRepository<ChildService, ChildServiceRepository>();
            options.AddRepository<ChildService_SubcriptionService, ChildService_SubcriptionServiceRepository>();
            options.AddRepository<SubcriptionService, SubcriptionServiceRepository>();
            options.AddRepository<User_SubcriptionService, User_SubcriptionServiceRepository>();
            options.AddRepository<User_ChildService, User_ChildServiceRepository>();
            options.AddRepository<SubcriptionPrice, SubcriptionPriceRepository>();
            options.AddRepository<EffectingJobService, EffectingJobServiceRepository>();
                
            options.AddRepository<CartEntity, CartRepository>();

        });


        context.Services.AddTransient<ICandidateProfileRepository, CandidateRepository>();
        context.Services.AddTransient<IRecruiterRepository, RecruiterProfileRepository>();
        context.Services.AddTransient<IEmployeeRepository, EmployeeProfileRepository>();
        context.Services.AddTransient<IJobPostRepository, JobPostRepository>();
        context.Services.AddTransient<IRecruitmentCampainRepository, RecruitmentCampainRepository>();

        context.Services.AddTransient<IJobCategoryRepository, JobCategoryRepository>();
        context.Services.AddTransient<ITagRepository, TagRepository>();
        context.Services.AddTransient<ICategoryTagRepository, CategoryTagRepository>();
        context.Services.AddTransient<IJobTagRepository, JobTagRepository>();

        context.Services.AddTransient<IChildServiceRepository, ChildServiceRepository>();
        context.Services.AddTransient<IChildService_SubcriptionServiceRepository, ChildService_SubcriptionServiceRepository>();
        context.Services.AddTransient<ISubcriptionServiceRepository, SubcriptionServiceRepository>();
        context.Services.AddTransient<IUser_SubcriptionServicerRepository, User_SubcriptionServiceRepository>();
        context.Services.AddTransient<IUser_ChildServiceRepository, User_ChildServiceRepository>();
        context.Services.AddTransient<ISubcriptionPriceRepository, SubcriptionPriceRepository>();
        context.Services.AddTransient<IEffectingJobServiceRepository, EffectingJobServiceRepository>();
        context.Services.AddTransient<ICartRepository, CartRepository>();


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
