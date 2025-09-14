using Volo.Abp.Modularity;

namespace VCareer;

public abstract class VCareerApplicationTestBase<TStartupModule> : VCareerTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
