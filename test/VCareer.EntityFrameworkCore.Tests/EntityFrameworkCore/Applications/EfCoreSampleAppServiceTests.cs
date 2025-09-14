using VCareer.Samples;
using Xunit;

namespace VCareer.EntityFrameworkCore.Applications;

[Collection(VCareerTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<VCareerEntityFrameworkCoreTestModule>
{

}
