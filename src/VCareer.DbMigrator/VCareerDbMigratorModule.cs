using VCareer.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace VCareer.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(VCareerEntityFrameworkCoreModule),
    typeof(VCareerApplicationContractsModule)
)]
public class VCareerDbMigratorModule : AbpModule
{
}
