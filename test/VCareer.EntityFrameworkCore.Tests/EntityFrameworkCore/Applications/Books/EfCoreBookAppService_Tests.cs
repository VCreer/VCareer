using VCareer.Books;
using Xunit;

namespace VCareer.EntityFrameworkCore.Applications.Books;

[Collection(VCareerTestConsts.CollectionDefinitionName)]
public class EfCoreBookAppService_Tests : BookAppService_Tests<VCareerEntityFrameworkCoreTestModule>
{

}