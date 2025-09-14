using Volo.Abp.Modularity;

namespace VCareer;

[DependsOn(
    typeof(VCareerApplicationModule),
    typeof(VCareerDomainTestModule)
)]
public class VCareerApplicationTestModule : AbpModule
{

}
