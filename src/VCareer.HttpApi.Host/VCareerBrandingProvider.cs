using Microsoft.Extensions.Localization;
using VCareer.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace VCareer;

[Dependency(ReplaceServices = true)]
public class VCareerBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<VCareerResource> _localizer;

    public VCareerBrandingProvider(IStringLocalizer<VCareerResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
