using Microsoft.EntityFrameworkCore;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.BlobStoring.Database.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.Modeling;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Models.IpAddress;
using VCareer.Models;
using VCareer.Models.Token;
using VCareer.Models.Job;

namespace VCareer.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class VCareerDbContext :
    AbpDbContext<VCareerDbContext>,
    ITenantManagementDbContext,
    IIdentityDbContext
{
    /* Add DbSet properties for your Aggregate Roots / Entities here. */

    public DbSet<Book> Books { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Industry> Industries { get; set; }
    public DbSet<CandidateProfile> CandidateProfiles { get; set; }
    public DbSet<EmployeeProfile> EmployeeProfiles { get; set; }
    public DbSet<RecruiterProfile> RecruiterProfiles { get; set; }
    public DbSet<IpAddress> IpAddresses { get; set; }
    public DbSet<EmployeeIpAddress> EmployeeIpAdresses { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    public DbSet<CurriculumVitae> CVs { get; set; }

    public DbSet<District> Districts { get; set; }
    public DbSet<Province> Provinces { get; set; }
    public DbSet<Job_Category> JobCategories { get; set; }
    public DbSet<Job_Posting> JobPostings { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<JobPostingTag> JobPostingTags { get; set; }



    #region Entities from the modules

    /* Notice: We only implemented IIdentityProDbContext and ISaasDbContext
     * and replaced them for this DbContext. This allows you to perform JOIN
     * queries for the entities of these modules over the repositories easily. You
     * typically don't need that for other modules. But, if you need, you can
     * implement the DbContext interface of the needed module and use ReplaceDbContext
     * attribute just like IIdentityProDbContext and ISaasDbContext.
     *
     * More info: Replacing a DbContext of a module ensures that the related module
     * uses this DbContext on runtime. Otherwise, it will use its own DbContext class.
     */

    // Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }

    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public VCareerDbContext(DbContextOptions<VCareerDbContext> options)
        : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        /* Include modules to your migration db context */

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureFeatureManagement();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureTenantManagement();
        builder.ConfigureBlobStoring();


        //-----------fluent api cho tag -----------

        builder.Entity<Tag>(b =>
        {
            b.ToTable("Tags");
            b.ConfigureByConvention();

            // Properties
            b.Property(x => x.Name).HasMaxLength(100).IsRequired();
            b.Property(x => x.Slug).HasMaxLength(200).IsRequired();

            // Unique index for Name
            b.HasIndex(x => x.Name).IsUnique(); // Đảm bảo tag name unique

            // Relationships
            b.HasMany(x => x.JobPostingTags)
             .WithOne(x => x.Tag)
             .HasForeignKey(x => x.TagId)
             .OnDelete(DeleteBehavior.Cascade); // Xóa liên kết khi tag bị xóa
        });


        //-----------fluent api cho jobPostingTag -----------

        builder.Entity<JobPostingTag>(b =>
        {
            b.ToTable("JobPostingTags");
            b.HasKey(x => new { x.JobPostingId, x.TagId }); // Composite key

            // Relationships
            b.HasOne(x => x.JobPosting)
             .WithMany(x => x.JobPostingTags)
             .HasForeignKey(x => x.JobPostingId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Tag)
             .WithMany(x => x.JobPostingTags)
             .HasForeignKey(x => x.TagId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        //-----------fluent api cho province-----------

        builder.Entity<Province>(b =>
        {
            b.ToTable("Provinces");
            b.ConfigureByConvention();

            b.HasMany(x => x.Districts).WithOne(x => x.Province).HasForeignKey(x => x.ProvinceId).OnDelete(DeleteBehavior.Cascade);
        });

        //-----------fluent api cho disstrict------------

        builder.Entity<District>(b =>
        {
            b.ToTable("Districts");
            b.ConfigureByConvention();

            b.HasOne(x => x.Province).WithMany(x => x.Districts).HasForeignKey(x => x.ProvinceId).OnDelete(DeleteBehavior.Cascade);
        });

        //-----------fluent api cho job_category--------------

        builder.Entity<Job_Category>(b =>
   {
       b.ToTable("JobCategories");
       b.ConfigureByConvention();
       
       // Properties configuration
       b.Property(x => x.Name).HasMaxLength(200).IsRequired();
       b.Property(x => x.Slug).HasMaxLength(250).IsRequired();
       b.Property(x => x.Description).HasMaxLength(2000);
       b.Property(x => x.SortOrder).HasDefaultValue(0);
       b.Property(x => x.IsActive).HasDefaultValue(true);
       b.Property(x => x.JobCount).HasDefaultValue(0);
    
       // Indexes for performance
       b.HasIndex(x => x.Slug).IsUnique();
       b.HasIndex(x => x.ParentId);
       b.HasIndex(x => x.IsActive);
       
       // Relationships
       b.HasOne(x => x.Parent)
        .WithMany(x => x.Children)
        .HasForeignKey(x => x.ParentId)
        .OnDelete(DeleteBehavior.Restrict);
        
       b.HasMany(x => x.JobPostings)
        .WithOne(x => x.JobCategory)
        .HasForeignKey(x => x.JobCategoryId)
        .OnDelete(DeleteBehavior.Cascade);
   });

        //-----------fluent api cho job_posting----------

        builder.Entity<Job_Posting>(b =>
          {
              b.ToTable("JobPostings");
              b.ConfigureByConvention();

              b.HasKey(j => j.Id);


              b.Property(j => j.Title).IsRequired().HasMaxLength(256);
              b.Property(j => j.Slug).IsRequired().HasMaxLength(300);
              b.Property(j => j.Image).HasMaxLength(500);
              b.Property(j => j.Description).HasMaxLength(5000);
              b.Property(j => j.Requirements).HasMaxLength(5000);
              b.Property(j => j.Benefits).HasMaxLength(5000);
              b.Property(j => j.WorkLocation).HasMaxLength(500);

              b.Property(x => x.SalaryDeal).HasDefaultValue(false);
              b.Property(x => x.IsUrgent).HasDefaultValue(false);
              b.Property(x => x.ApplyCount).HasDefaultValue(0);


              // Relationships
              b.HasOne(x => x.JobCategory)
               .WithMany(x => x.JobPostings)
               .HasForeignKey(x => x.JobCategoryId)
               .OnDelete(DeleteBehavior.Cascade); // Xóa job khi category bị xóa

              b.HasOne(x => x.RecruiterProfile)
               .WithMany(x => x.JobPostings)
               .HasForeignKey(x => x.RecruiterId)
               .OnDelete(DeleteBehavior.Cascade); // Xóa job khi recruiter profile bị xóa

              b.HasMany(x => x.JobPostingTags)
               .WithOne(x => x.JobPosting)
               .HasForeignKey(x => x.JobPostingId)
               .OnDelete(DeleteBehavior.Cascade); // Xóa liên kết khi job bị xóa

          });

        //-----------fluent api cho book-------------
        builder.Entity<Book>(b =>
        {
            b.ToTable(VCareerConsts.DbTablePrefix + "Books",
                VCareerConsts.DbSchema);
            b.ConfigureByConvention(); //auto configure for the base class props
            b.Property(x => x.Name).IsRequired().HasMaxLength(128);
        });

        //-----------fluent api cho employye-------------
        builder.Entity<EmployeeProfile>(e =>
        {
            e.ToTable("EmployeeProfiles");
            e.ConfigureByConvention();
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<EmployeeProfile>(x => x.UserId)
            .IsRequired();
        });

        //-----------fluent api cho candidate-------------
        builder.Entity<CandidateProfile>(e =>
        {
            e.ToTable("CandidateProfile");
            e.ConfigureByConvention();
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<CandidateProfile>(x => x.UserId)
            .IsRequired();
        });

        //-----------fluent api cho recuiter------------

        builder.Entity<RecruiterProfile>(e =>
        {
            e.ToTable("RecruiterProfile");
            e.ConfigureByConvention();
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<RecruiterProfile>(x => x.UserId)
            .IsRequired();

            e.HasOne(x => x.Company)
        .WithMany(c => c.RecruiterProfiles)
        .HasForeignKey(x => x.CompanyId)
        .OnDelete(DeleteBehavior.Restrict);




            e.HasMany(x => x.JobPostings)
             .WithOne(x => x.RecruiterProfile)
             .HasForeignKey(x => x.RecruiterId)
             .OnDelete(DeleteBehavior.Cascade); // Xóa liên kết khi job bị xóa
        });

        //-----------fluent api cho company-------------

        builder.Entity<Company>(c =>
        {
            c.ToTable("Companies");
            c.ConfigureByConvention();
            c.HasMany(x => x.CompanyIndustries)
            .WithOne()
            .HasForeignKey(x => x.CompanyId)
            .IsRequired();
            c.HasKey(x => x.Id);
            c.Property(x => x.Id)
              .ValueGeneratedOnAdd()
              .UseIdentityColumn();

            c.HasMany(x => x.RecruiterProfiles)
            .WithOne()
            .HasForeignKey(x => x.CompanyId)
            .IsRequired();

            // Legal Information fields configuration
            c.Property(x => x.TaxCode).HasMaxLength(50);
            c.Property(x => x.BusinessLicenseNumber).HasMaxLength(100);
            c.Property(x => x.BusinessLicenseIssuePlace).HasMaxLength(255);
            c.Property(x => x.LegalRepresentative).HasMaxLength(255);
            c.Property(x => x.BusinessLicenseFile).HasMaxLength(500);
            c.Property(x => x.TaxCertificateFile).HasMaxLength(500);
            c.Property(x => x.RepresentativeIdCardFile).HasMaxLength(500);
            c.Property(x => x.OtherSupportFile).HasMaxLength(500);
            c.Property(x => x.LegalVerificationStatus).HasMaxLength(50);

            // Unique constraints
            c.HasIndex(x => x.TaxCode).IsUnique().HasFilter("[TaxCode] IS NOT NULL");
            c.HasIndex(x => x.BusinessLicenseNumber).IsUnique().HasFilter("[BusinessLicenseNumber] IS NOT NULL");
        });

        builder.Entity<CurriculumVitae>(cv =>
        {
            cv.ToTable("CVs");
            cv.ConfigureByConvention();

            // Foreign key relationship với CandidateProfile
            cv.HasOne(x => x.Candidate)
              .WithMany()
              .HasForeignKey(x => x.CandidateId)
              .OnDelete(DeleteBehavior.Restrict);

            // Foreign key relationship với IdentityUser
            cv.HasOne(x => x.User)
              .WithMany()
              .HasForeignKey(x => x.CandidateId)
              .OnDelete(DeleteBehavior.Cascade);

            // Field configurations
            cv.Property(x => x.CVName).IsRequired().HasMaxLength(255);
            cv.Property(x => x.CVType).IsRequired().HasMaxLength(50);
            cv.Property(x => x.Status).IsRequired().HasMaxLength(50);
            cv.Property(x => x.FullName).HasMaxLength(255);
            cv.Property(x => x.Email).HasMaxLength(256);
            cv.Property(x => x.PhoneNumber).HasMaxLength(20);
            cv.Property(x => x.Address).HasMaxLength(500);
            cv.Property(x => x.CareerObjective).HasMaxLength(1000);
            cv.Property(x => x.OriginalFileName).HasMaxLength(255);
            cv.Property(x => x.FileUrl).HasMaxLength(500);
            cv.Property(x => x.FileType).HasMaxLength(50);
            cv.Property(x => x.Description).HasMaxLength(1000);
            cv.Property(x => x.Interests).HasMaxLength(1000);

            // Indexes
            cv.HasIndex(x => x.CandidateId);
            cv.HasIndex(x => x.CVType);
            cv.HasIndex(x => x.Status);
            cv.HasIndex(x => x.IsDefault);
            cv.HasIndex(x => x.IsPublic);
        });

        builder.Entity<Industry>(c =>
        {
            c.ToTable("Industries");
            c.ConfigureByConvention();
            c.HasMany(x => x.CompanyIndustries)
            .WithOne()
            .HasForeignKey(x => x.IndustryId)
            .IsRequired();
            c.HasKey(x => x.Id);
            c.Property(x => x.Id)
                 .ValueGeneratedOnAdd()
                 .UseIdentityColumn();
        });

        //-----------fluent api cho companyIndistry---------

        builder.Entity<CompanyIndustry>(ci =>
        {
            ci.ToTable("CompanyIndustries");
            ci.ConfigureByConvention();
            ci.Property(x => x.Id)
                  .ValueGeneratedOnAdd()
                  .UseIdentityColumn();
            ci.HasKey(x => x.Id);
            ci.HasIndex(x => new { x.CompanyId, x.IndustryId })
      .IsUnique();

            ci.HasOne(ci => ci.Company)
         .WithMany(c => c.CompanyIndustries)
         .HasForeignKey(ci => ci.CompanyId)
         .OnDelete(DeleteBehavior.Cascade);

            ci.HasOne(ci => ci.Industry)
                .WithMany(i => i.CompanyIndustries)
                .HasForeignKey(ci => ci.IndustryId)
                .OnDelete(DeleteBehavior.Restrict);

        });


        builder.Entity<EmployeeProfile>(e =>
        {
            e.ToTable("EmployeeProfiles");
            e.ConfigureByConvention();
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<EmployeeProfile>(x => x.UserId)
            .IsRequired();
        });


        builder.Entity<CandidateProfile>(e =>
        {
            e.ToTable("CandidateProfile");
            e.ConfigureByConvention();
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<CandidateProfile>(x => x.UserId)
            .IsRequired();
        });

        builder.Entity<RecruiterProfile>(e =>
        {
            e.ToTable("RecruiterProfile");
            e.ConfigureByConvention();
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<RecruiterProfile>(x => x.UserId)
            .IsRequired();

        });

        builder.Entity<Company>(c =>
        {
            c.ToTable("Companies");
            c.ConfigureByConvention();
            c.HasMany(x => x.CompanyIndustries)
            .WithOne()
            .HasForeignKey(x => x.CompanyId)
            .IsRequired();
            c.HasKey(x => x.Id);
            c.Property(x => x.Id)
              .ValueGeneratedOnAdd()
              .UseIdentityColumn();

            c.HasMany(x => x.RecruiterProfiles)
            .WithOne()
            .HasForeignKey(x => x.CompanyId)
            .IsRequired();
        });

        builder.Entity<Industry>(c =>
        {
            c.ToTable("Industries");
            c.ConfigureByConvention();
            c.HasMany(x => x.CompanyIndustries)
            .WithOne()
            .HasForeignKey(x => x.IndustryId)
            .IsRequired();
            c.HasKey(x => x.Id);
            c.Property(x => x.Id)
                 .ValueGeneratedOnAdd()
                 .UseIdentityColumn();
        });

        builder.Entity<CompanyIndustry>(ci =>
        {
            ci.ToTable("CompanyIndustries");
            ci.ConfigureByConvention();
            ci.Property(x => x.Id)
                  .ValueGeneratedOnAdd()
                  .UseIdentityColumn();
            ci.HasKey(x => x.Id);
            ci.HasIndex(x => new { x.CompanyId, x.IndustryId })
      .IsUnique();

            ci.HasOne(ci => ci.Company)
         .WithMany(c => c.CompanyIndustries)
         .HasForeignKey(ci => ci.CompanyId)
         .OnDelete(DeleteBehavior.Cascade);

            ci.HasOne(ci => ci.Industry)
                .WithMany(i => i.CompanyIndustries)
                .HasForeignKey(ci => ci.IndustryId)
                .OnDelete(DeleteBehavior.Cascade);

        });

        builder.Entity<IpAddress>(i =>
        {
            i.ToTable("IpAddresses");
            i.ConfigureByConvention();
            i.HasKey(x => x.Id);
            i.Property(x => x.Id)
                .ValueGeneratedOnAdd()
                .UseIdentityColumn();

            i.HasMany(x => x.EmployeeIpAdresses)
                .WithOne(e => e.IpAddress)
                .HasForeignKey(e => e.IpAdressId)
                .IsRequired();
        });

        builder.Entity<EmployeeIpAddress>(e =>
        {
            e.ToTable("EmployeeIpAddresses");
            e.ConfigureByConvention();
            e.HasKey(x => x.Id);
            e.Property(x => x.Id)
                .ValueGeneratedOnAdd()
                .UseIdentityColumn();

            e.HasOne(x => x.EmployeeProfile)
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .IsRequired();
        });

        builder.Entity<RefreshToken>(b =>
        {
            b.ToTable("AppRefreshTokens");
            b.HasKey(x => x.Id);
            b.Property(x => x.Token).IsRequired().HasMaxLength(256);
            b.HasIndex(x => x.Token).IsUnique();
        });

    }
}