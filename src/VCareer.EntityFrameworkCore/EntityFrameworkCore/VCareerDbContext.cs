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
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Models.IpAddress;
using VCareer.Models;
using VCareer.Models.Token;

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

        builder.Entity<Book>(b =>
        {
            b.ToTable(VCareerConsts.DbTablePrefix + "Books",
                VCareerConsts.DbSchema);
            b.ConfigureByConvention(); //auto configure for the base class props
            b.Property(x => x.Name).IsRequired().HasMaxLength(128);
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
