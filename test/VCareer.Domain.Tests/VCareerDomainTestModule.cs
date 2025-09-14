using Volo.Abp.Modularity;

namespace VCareer;

[DependsOn(
    typeof(VCareerDomainModule),
    typeof(VCareerTestBaseModule)
)]
public class VCareerDomainTestModule : AbpModule
{

}
