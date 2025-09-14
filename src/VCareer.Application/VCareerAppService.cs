using VCareer.Localization;
using Volo.Abp.Application.Services;

namespace VCareer;

/* Inherit your application services from this class.
 */
public abstract class VCareerAppService : ApplicationService
{
    protected VCareerAppService()
    {
        LocalizationResource = typeof(VCareerResource);
    }
}
