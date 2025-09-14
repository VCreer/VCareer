using VCareer.Samples;
using Xunit;

namespace VCareer.EntityFrameworkCore.Domains;

[Collection(VCareerTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<VCareerEntityFrameworkCoreTestModule>
{

}
