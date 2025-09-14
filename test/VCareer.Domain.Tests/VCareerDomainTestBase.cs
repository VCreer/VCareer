using Volo.Abp.Modularity;

namespace VCareer;

/* Inherit from this class for your domain layer tests. */
public abstract class VCareerDomainTestBase<TStartupModule> : VCareerTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
