using VCareer.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class VCareerController : AbpControllerBase
{
    protected VCareerController()
    {
        LocalizationResource = typeof(VCareerResource);
    }
}
