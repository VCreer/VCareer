using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using VCareer.Books;
using VCareer.Models.Companies;
using VCareer.Models.Job;
using VCareer.Models.Users;
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
       b.Property(x => x.Name).HasMaxLength(1000).IsRequired();
       b.Property(x => x.Slug).HasMaxLength(1000).IsRequired();
       b.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
       b.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnUpdate();
       b.Property(x => x.IsActive).HasDefaultValue(false);
       b.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
       b.HasMany(x => x.JobPostings).WithOne(x => x.JobCategory).HasForeignKey(x => x.JobCategoryId).OnDelete(DeleteBehavior.Cascade);
   });

        //-----------fluent api cho job_posting----------

        builder.Entity<Job_Posting>(b =>
          {
              b.ToTable("JobPostings");
              b.ConfigureByConvention();
              b.Property(x => x.Title).HasMaxLength(2000).IsRequired();
              b.Property(x => x.Slug).HasMaxLength(2000).IsRequired();
              b.Property(x => x.Description).HasMaxLength(2000).IsRequired();
              b.Property(x => x.Requirements).HasMaxLength(2000).IsRequired();
              b.Property(x => x.Benefits).HasMaxLength(2000).IsRequired();
              b.Property(x => x.WorkTime).HasMaxLength(200).IsRequired();
              b.Property(x => x.WorkLocation).HasMaxLength(200).IsRequired();
              b.Property(x => x.Benefits).HasMaxLength(2000).IsRequired();
              b.Property(x => x.Benefits).HasMaxLength(2000).IsRequired();
              b.Property(x => x.PostedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
              b.Property(x => x.Keywords).HasMaxLength(200);

              b.Property(x => x.SalaryDeal).HasDefaultValue(false);
              b.Property(x => x.IsUrgent).HasDefaultValue(false);
              b.Property(x => x.AppllyCount).HasDefaultValue(0);
              b.HasOne(x => x.JobCategory).WithMany(x => x.JobPostings).HasForeignKey(x => x.JobCategoryId).OnDelete(DeleteBehavior.Cascade);
              b.HasOne(x => x.RecruiterProfile).WithMany().HasForeignKey(x => x.RecuterId).OnDelete(DeleteBehavior.Cascade);


              // Relationships
              b.HasOne(x => x.JobCategory)
               .WithMany(x => x.JobPostings)
               .HasForeignKey(x => x.JobCategoryId)
               .OnDelete(DeleteBehavior.Cascade); // Xóa job khi category bị xóa

              b.HasOne(x => x.RecruiterProfile)
               .WithMany(x => x.JobPostings)
               .HasForeignKey(x => x.RecuterId)
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
             .HasForeignKey(x => x.RecuterId)
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

        //-----------fluent api cho industry-------

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


    }
}