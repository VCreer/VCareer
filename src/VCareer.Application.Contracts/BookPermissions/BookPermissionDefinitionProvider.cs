using VCareer.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace VCareer.Permissions;

public class BookPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(BookPermissions.GroupName);

        var booksPermission = myGroup.AddPermission(BookPermissions.Books.Default, L("Permission:Books"));
        booksPermission.AddChild(BookPermissions.Books.Create, L("Permission:Books.Create"));
        booksPermission.AddChild(BookPermissions.Books.Edit, L("Permission:Books.Edit"));
        booksPermission.AddChild(BookPermissions.Books.Delete, L("Permission:Books.Delete"));
        //Define your own permissions here. Example:
        //myGroup.AddPermission(VCareerPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<VCareerResource>(name);
    }
}
