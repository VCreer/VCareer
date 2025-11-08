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
using VCareer.Models.FileMetadata;
using VCareer.Models.CV;
using VCareer.Models.Applications;

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
   
    
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    
    // Applications
    public DbSet<JobApplication> JobApplications { get; set; }

    public DbSet<District> Districts { get; set; }
    public DbSet<Province> Provinces { get; set; }
    public DbSet<Job_Category> JobCategories { get; set; }
    public DbSet<Job_Posting> JobPostings { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<JobPostingTag> JobPostingTags { get; set; }
    public DbSet<SavedJob> SavedJobs { get; set; }
    public DbSet<FileDescriptor> FileDescriptors { get; set; }
    public DbSet<UploadedCv> UploadedCvs { get; set; }

    // CV Management
    public DbSet<CvTemplate> CvTemplates { get; set; }
    public DbSet<CandidateCv> CandidateCvs { get; set; }

    

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
        // (CandidateProfile configuration đã được di chuyển xuống dưới, cùng với CandidateCv relationship)

        //-----------fluent api cho SavedJob-------------
        builder.Entity<SavedJob>(e =>
        {
            e.ToTable(VCareerConsts.DbTablePrefix + "SavedJobs", VCareerConsts.DbSchema);
            e.ConfigureByConvention();

            // Composite primary key: CandidateId + JobId
            e.HasKey(x => new { x.CandidateId, x.JobId });

            // Relationship với CandidateProfile
            e.HasOne(x => x.CandidateProfile)
                .WithMany()
                .HasForeignKey(x => x.CandidateId)
                .OnDelete(DeleteBehavior.Cascade); // Xóa SavedJob khi Candidate bị xóa

            // Relationship với JobPosting
            // Dùng Restrict để tránh multiple cascade paths
            // (JobPosting đã có cascade đến RecruiterProfile, nên không thể cascade từ SavedJob)
            e.HasOne(x => x.JobPosting)
                .WithMany()
                .HasForeignKey(x => x.JobId)
                .OnDelete(DeleteBehavior.Restrict); // Không cho xóa Job nếu còn SavedJob

            // Index để tìm kiếm nhanh
            e.HasIndex(x => x.CandidateId);
            e.HasIndex(x => x.JobId);
            e.HasIndex(x => new { x.CandidateId, x.JobId }).IsUnique();
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

        

        // ========== CV Template Configuration ==========
        builder.Entity<CvTemplate>(template =>
        {
            template.ToTable("CvTemplates");
            template.ConfigureByConvention();

            template.HasKey(x => x.Id);

            // Required fields
            template.Property(x => x.Name).HasMaxLength(200).IsRequired();
            template.Property(x => x.LayoutDefinition).IsRequired();

            // Optional fields
            template.Property(x => x.Description).HasMaxLength(500).IsRequired(false);
            template.Property(x => x.PreviewImageUrl).HasMaxLength(500).IsRequired(false);
            template.Property(x => x.Styles).IsRequired(false);
            template.Property(x => x.SupportedFields).IsRequired(false);
            template.Property(x => x.Category).HasMaxLength(100).IsRequired(false);
            template.Property(x => x.Version).HasMaxLength(20).IsRequired(false);

            // Default values
            template.Property(x => x.SortOrder).HasDefaultValue(0);
            template.Property(x => x.IsActive).HasDefaultValue(true);
            template.Property(x => x.IsDefault).HasDefaultValue(false);
            template.Property(x => x.IsFree).HasDefaultValue(true);

            // Indexes
            template.HasIndex(x => x.IsActive);
            template.HasIndex(x => x.IsFree);
            template.HasIndex(x => x.Category);
            template.HasIndex(x => x.SortOrder);
        });

        // ========== Candidate CV Configuration ==========
        builder.Entity<CandidateCv>(cv =>
        {
            cv.ToTable("CandidateCvs");
            cv.ConfigureByConvention();

            cv.HasKey(x => x.Id);

            // Required fields
            cv.Property(x => x.CandidateId).IsRequired();
            cv.Property(x => x.TemplateId).IsRequired();
            cv.Property(x => x.CvName).HasMaxLength(200).IsRequired();
            cv.Property(x => x.DataJson).IsRequired();

            // Optional fields
            cv.Property(x => x.Notes).HasMaxLength(1000).IsRequired(false);
            cv.Property(x => x.PublishedAt).IsRequired(false);

            // Default values
            cv.Property(x => x.IsPublished).HasDefaultValue(false);
            cv.Property(x => x.IsDefault).HasDefaultValue(false);
            cv.Property(x => x.IsPublic).HasDefaultValue(false);
            cv.Property(x => x.ViewCount).HasDefaultValue(0);

            // Foreign key relationships
            // 1. Relationship với CandidateProfile (CandidateId = CandidateProfile.UserId)
            cv.HasOne(x => x.CandidateProfile)
                .WithMany(x => x.CandidateCvs)
                .HasForeignKey(x => x.CandidateId)
                .HasPrincipalKey(x => x.UserId) // Sử dụng UserId làm principal key thay vì Id
                .OnDelete(DeleteBehavior.Cascade); // Khi xóa CandidateProfile thì xóa tất cả CVs

            // 2. Relationship với CvTemplate
            cv.HasOne(x => x.Template)
                .WithMany()
                .HasForeignKey(x => x.TemplateId)
                .OnDelete(DeleteBehavior.Restrict); // Không cho xóa template nếu đang được sử dụng

            // Indexes
            cv.HasIndex(x => x.CandidateId);
            cv.HasIndex(x => x.TemplateId);
            cv.HasIndex(x => x.IsPublished);
            cv.HasIndex(x => x.IsDefault);
            cv.HasIndex(x => x.IsPublic);
            cv.HasIndex(x => new { x.CandidateId, x.IsDefault }); // Composite index for default CV lookup
        });

        // ========== Uploaded CV Configuration ==========
        builder.Entity<UploadedCv>(uploadedCv =>
        {
            uploadedCv.ToTable("UploadedCvs");
            uploadedCv.ConfigureByConvention();
            uploadedCv.HasKey(x => x.Id);

            // Required fields
            uploadedCv.Property(x => x.CandidateId).IsRequired();
            uploadedCv.Property(x => x.FileDescriptorId).IsRequired();
            uploadedCv.Property(x => x.CvName).HasMaxLength(200).IsRequired();

            // Optional fields
            uploadedCv.Property(x => x.Notes).HasMaxLength(1000).IsRequired(false);

            // Default values
            uploadedCv.Property(x => x.IsDefault).HasDefaultValue(false);
            uploadedCv.Property(x => x.IsPublic).HasDefaultValue(false);

            // Foreign key relationships
            // 1. Relationship với CandidateProfile (CandidateId = CandidateProfile.UserId)
            uploadedCv.HasOne(x => x.CandidateProfile)
                .WithMany(x => x.UploadedCvs)
                .HasForeignKey(x => x.CandidateId)
                .HasPrincipalKey(x => x.UserId) // Sử dụng UserId làm principal key
                .OnDelete(DeleteBehavior.Cascade); // Khi xóa CandidateProfile thì xóa tất cả UploadedCvs

            // 2. Relationship với FileDescriptor
            uploadedCv.HasOne(x => x.FileDescriptor)
                .WithMany()
                .HasForeignKey(x => x.FileDescriptorId)
                .OnDelete(DeleteBehavior.Restrict); // Không cho xóa FileDescriptor nếu đang được sử dụng

            // Indexes
            uploadedCv.HasIndex(x => x.CandidateId);
            uploadedCv.HasIndex(x => x.FileDescriptorId);
            uploadedCv.HasIndex(x => x.IsDefault);
            uploadedCv.HasIndex(x => x.IsPublic);
            uploadedCv.HasIndex(x => new { x.CandidateId, x.IsDefault }); // Composite index for default CV lookup
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

            // One-to-Many relationship với CandidateCv
            // CandidateId trong CandidateCv sẽ reference đến UserId trong CandidateProfile
            e.HasMany(x => x.CandidateCvs)
                .WithOne(x => x.CandidateProfile)
                .HasForeignKey(x => x.CandidateId)
                .HasPrincipalKey(x => x.UserId) // Sử dụng UserId làm principal key
                .OnDelete(DeleteBehavior.Cascade);
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
        builder.Entity<FileDescriptor>(e =>
        {
            e.ToTable("FileDescriptors");
            e.ConfigureByConvention();
            e.HasKey(x => x.Id);
            e.Property(x => x.Id)
                .ValueGeneratedOnAdd();
        });

        // JobApplication Configuration
        builder.Entity<JobApplication>(ja =>
        {
            ja.ToTable("JobApplications");
            ja.ConfigureByConvention();

            // Foreign Keys
            // Lưu ý: CandidateProfile có primary key là UserId, nên JobApplication.CandidateId = CandidateProfile.UserId
            ja.HasOne(x => x.Candidate)
              .WithMany()
              .HasForeignKey(x => x.CandidateId)
              .HasPrincipalKey(x => x.UserId) // Sử dụng UserId làm principal key
              .OnDelete(DeleteBehavior.Restrict);

            ja.HasOne(x => x.Company)
              .WithMany()
              .HasForeignKey(x => x.CompanyId)
              .OnDelete(DeleteBehavior.Restrict);

            ja.HasOne(x => x.CandidateCv)
              .WithMany()
              .HasForeignKey(x => x.CandidateCvId)
              .OnDelete(DeleteBehavior.SetNull);

            ja.HasOne(x => x.UploadedCv)
              .WithMany()
              .HasForeignKey(x => x.UploadedCvId)
              .OnDelete(DeleteBehavior.Restrict); // Changed from SetNull to Restrict to avoid cascade path conflicts

            // Properties
            ja.Property(x => x.JobId).IsRequired();
            ja.Property(x => x.CandidateId).IsRequired();
            ja.Property(x => x.CompanyId).IsRequired();
            ja.Property(x => x.CVType).HasMaxLength(20).IsRequired();
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
        /*builder.Entity<ApplicationDocument>(ad =>
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