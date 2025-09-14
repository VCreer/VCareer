using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace VCareer.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class VCareerDbContextFactory : IDesignTimeDbContextFactory<VCareerDbContext>
{
    public VCareerDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        
        VCareerEfCoreEntityExtensionMappings.Configure();

        var builder = new DbContextOptionsBuilder<VCareerDbContext>()
            .UseSqlServer(configuration.GetConnectionString("Default"));
        
        return new VCareerDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../VCareer.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
