using VCareer.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace VCareer.Permissions;

public class VCareerPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(VCareerPermissions.GroupName);

        var booksPermission = myGroup.AddPermission(VCareerPermissions.Books.Default, L("Permission:Books"));
        booksPermission.AddChild(VCareerPermissions.Books.Create, L("Permission:Books.Create"));
        booksPermission.AddChild(VCareerPermissions.Books.Edit, L("Permission:Books.Edit"));
        booksPermission.AddChild(VCareerPermissions.Books.Delete, L("Permission:Books.Delete"));
        //Define your own permissions here. Example:
        //myGroup.AddPermission(VCareerPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<VCareerResource>(name);
    }
}
