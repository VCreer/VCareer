using Microsoft.Extensions.DependencyInjection;
using VCareer.Services.Profile;
using Volo.Abp;
using Volo.Abp.Modularity;

namespace VCareer.Profile;

[DependsOn(
    typeof(VCareerApplicationTestModule),
    typeof(AbpTestBaseModule)
)]
public class ProfileTestModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        // Configure test-specific services here if needed
        // For example, you might want to use in-memory database for tests
        context.Services.AddSingleton<IProfileAppService, ProfileAppService>();
    }
}
