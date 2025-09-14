using Xunit;

namespace VCareer.EntityFrameworkCore;

[CollectionDefinition(VCareerTestConsts.CollectionDefinitionName)]
public class VCareerEntityFrameworkCoreCollection : ICollectionFixture<VCareerEntityFrameworkCoreFixture>
{

}
