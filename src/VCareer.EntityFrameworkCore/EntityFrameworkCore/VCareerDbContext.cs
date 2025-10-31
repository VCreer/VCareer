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
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Models.ActivityLogs;
using VCareer.Models.Job;
/*using VCareer.Models.Applications;*/

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
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    /*public DbSet<JobApplication> JobApplications { get; set; }
    public DbSet<ApplicationDocument> ApplicationDocuments { get; set; }*/

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

            b.HasMany(x => x.Districts)
            .WithOne(x => x.Province)
            .HasForeignKey(x => x.ProvinceId)
            .OnDelete(DeleteBehavior.Cascade);


            b.HasMany(x => x.Job_Posting)
         .WithOne(x => x.Province)
         .HasForeignKey(x => x.ProvinceId)
         .OnDelete(DeleteBehavior.Cascade);





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


              b.HasOne(j => j.Province)
                .WithMany(p => p.Job_Posting)
                .HasForeignKey(j => j.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);



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

            // ⚠️ Nếu bạn thực sự muốn liên kết thêm với IdentityUser, 
            // hãy dùng khóa ngoại khác (vd: UserId), tránh trùng CandidateId.
            // cv.HasOne(x => x.User)
            //   .WithMany()
            //   .HasForeignKey(x => x.UserId)
            //   .OnDelete(DeleteBehavior.Cascade);

            // 🆔 Khóa chính
            cv.HasKey(x => x.Id);

            // 🧩 Cấu hình các trường — tất cả đều nullable trừ Id
            cv.Property(x => x.CandidateId).IsRequired();
            cv.Property(x => x.CVName).HasMaxLength(255).IsRequired(false);
            cv.Property(x => x.CVType).HasMaxLength(50).IsRequired(false);
            
            cv.Property(x => x.Status).HasMaxLength(50).IsRequired(false);
            cv.Property(x => x.IsDefault).IsRequired();
            cv.Property(x => x.IsPublic).IsRequired();
            cv.Property(x => x.FullName).HasMaxLength(255).IsRequired(false);
            cv.Property(x => x.Email).HasMaxLength(256).IsRequired(false);
            cv.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired(false);
            cv.Property(x => x.DateOfBirth).IsRequired(false);
            
            cv.Property(x => x.Address).HasMaxLength(500).IsRequired(false);
            cv.Property(x => x.CareerObjective).HasMaxLength(1000).IsRequired(false);
            cv.Property(x => x.WorkExperience).IsRequired(false);
            cv.Property(x => x.Education).IsRequired(false);
            cv.Property(x => x.Skills).IsRequired(false);
            cv.Property(x => x.Projects).IsRequired(false);
            cv.Property(x => x.Certificates).IsRequired(false);
            cv.Property(x => x.Languages).IsRequired(false);
            cv.Property(x => x.Interests).HasMaxLength(1000).IsRequired(false);
            cv.Property(x => x.OriginalFileName).HasMaxLength(255).IsRequired(false);
            cv.Property(x => x.FileUrl).HasMaxLength(500).IsRequired(false);
            cv.Property(x => x.FileSize).IsRequired(false);
            cv.Property(x => x.FileType).HasMaxLength(50).IsRequired(false);
            cv.Property(x => x.Description).HasMaxLength(1000).IsRequired(false);
            cv.Property(x => x.ExtraProperties).IsRequired(false);
            cv.Property(x => x.ConcurrencyStamp).HasMaxLength(40).IsRequired(false);
            cv.Property(x => x.CreationTime).IsRequired();
            cv.Property(x => x.CreatorId).IsRequired(false);
            cv.Property(x => x.LastModificationTime).IsRequired(false);
            cv.Property(x => x.LastModifierId).IsRequired(false);
            cv.Property(x => x.IsDeleted).IsRequired();
            cv.Property(x => x.DeleterId).IsRequired(false);
            cv.Property(x => x.DeletionTime).IsRequired(false);

            // 📊 Indexes
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

        // JobApplication Configuration
        /*builder.Entity<JobApplication>(ja =>
        {
            ja.ToTable("JobApplications");
            ja.ConfigureByConvention();

            // Foreign Keys
            ja.HasOne(x => x.Candidate)
              .WithMany()
              .HasForeignKey(x => x.CandidateId)
              .OnDelete(DeleteBehavior.Restrict);

            ja.HasOne(x => x.Company)
              .WithMany()
              .HasForeignKey(x => x.CompanyId)
              .OnDelete(DeleteBehavior.Restrict);

            ja.HasOne(x => x.CV)
              .WithMany()
              .HasForeignKey(x => x.CVId)
              .OnDelete(DeleteBehavior.SetNull);

            // Properties
            ja.Property(x => x.JobId).IsRequired();
            ja.Property(x => x.CandidateId).IsRequired();
            ja.Property(x => x.CompanyId).IsRequired();
            ja.Property(x => x.CVType).HasMaxLength(20).IsRequired();
            ja.Property(x => x.UploadedCVUrl).HasMaxLength(500);
            ja.Property(x => x.UploadedCVName).HasMaxLength(255);
            ja.Property(x => x.CandidateName).HasMaxLength(100);
            ja.Property(x => x.CandidateEmail).HasMaxLength(100);
            ja.Property(x => x.CandidatePhone).HasMaxLength(20);
            ja.Property(x => x.CoverLetter).HasMaxLength(2000);
            ja.Property(x => x.Status).HasMaxLength(20).IsRequired();
            ja.Property(x => x.RecruiterNotes).HasMaxLength(1000);
            ja.Property(x => x.RejectionReason).HasMaxLength(500);
            ja.Property(x => x.InterviewLocation).HasMaxLength(200);
            ja.Property(x => x.InterviewNotes).HasMaxLength(1000);
            ja.Property(x => x.WithdrawalReason).HasMaxLength(500);

            // Indexes
            ja.HasIndex(x => x.JobId);
            ja.HasIndex(x => x.CandidateId);
            ja.HasIndex(x => x.CompanyId);
            ja.HasIndex(x => x.CVType);
            ja.HasIndex(x => x.Status);
            ja.HasIndex(x => x.CreationTime);
            ja.HasIndex(x => new { x.JobId, x.CandidateId }).IsUnique(); // Prevent duplicate applications
        });

        builder.Entity<ActivityLog>(a =>
        {
            a.ToTable("ActivityLogs");
            a.ConfigureByConvention();
            a.HasKey(x => x.Id);
            
            a.Property(x => x.UserId).IsRequired();
            a.Property(x => x.ActivityType).IsRequired();
            a.Property(x => x.Action).IsRequired().HasMaxLength(256);
            a.Property(x => x.Description).HasMaxLength(2000);
            a.Property(x => x.EntityType).HasMaxLength(128);
            a.Property(x => x.IpAddress).HasMaxLength(64);
            a.Property(x => x.UserAgent).HasMaxLength(512);
            a.Property(x => x.Metadata).HasMaxLength(4000);
            
            // Indexes for better query performance
            a.HasIndex(x => x.UserId);
            a.HasIndex(x => x.ActivityType);
            a.HasIndex(x => x.CreationTime);
            a.HasIndex(x => new { x.UserId, x.ActivityType });
            a.HasIndex(x => new { x.UserId, x.CreationTime });
        });

        // ApplicationDocument Configuration
        builder.Entity<ApplicationDocument>(ad =>
        {
            ad.ToTable("ApplicationDocuments");
            ad.ConfigureByConvention();

            // Foreign Key
            ad.HasOne(x => x.Application)
              .WithMany()
              .HasForeignKey(x => x.ApplicationId)
              .OnDelete(DeleteBehavior.Cascade);

            // Properties
            ad.Property(x => x.ApplicationId).IsRequired();
            ad.Property(x => x.DocumentName).HasMaxLength(255).IsRequired();
            ad.Property(x => x.DocumentUrl).HasMaxLength(500).IsRequired();
            ad.Property(x => x.DocumentType).HasMaxLength(20).IsRequired();
            ad.Property(x => x.MimeType).HasMaxLength(100);
            ad.Property(x => x.Description).HasMaxLength(500);

            // Indexes
            ad.HasIndex(x => x.ApplicationId);
            ad.HasIndex(x => x.DocumentType);
            ad.HasIndex(x => x.IsPrimary);
        });*/

    }
}