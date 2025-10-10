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

        var profilePermission = myGroup.AddPermission(VCareerPermissions.Profile.Default, L("Permission:Profile"));
        profilePermission.AddChild(VCareerPermissions.Profile.UpdatePersonalInfo, L("Permission:Profile.UpdatePersonalInfo"));
        profilePermission.AddChild(VCareerPermissions.Profile.ChangePassword, L("Permission:Profile.ChangePassword"));
        profilePermission.AddChild(VCareerPermissions.Profile.DeleteAccount, L("Permission:Profile.DeleteAccount"));
        profilePermission.AddChild(VCareerPermissions.Profile.SubmitLegalInformation, L("Permission:Profile.SubmitLegalInformation"));
        profilePermission.AddChild(VCareerPermissions.Profile.UpdateLegalInformation, L("Permission:Profile.UpdateLegalInformation"));
        profilePermission.AddChild(VCareerPermissions.Profile.UploadSupportingDocument, L("Permission:Profile.UploadSupportingDocument"));
        profilePermission.AddChild(VCareerPermissions.Profile.UpdateSupportingDocument, L("Permission:Profile.UpdateSupportingDocument"));
        profilePermission.AddChild(VCareerPermissions.Profile.DeleteSupportingDocument, L("Permission:Profile.DeleteSupportingDocument"));
        profilePermission.AddChild(VCareerPermissions.Profile.DownloadSupportingDocument, L("Permission:Profile.DownloadSupportingDocument"));

        var cvPermission = myGroup.AddPermission(VCareerPermissions.CV.Default, L("Permission:CV"));
        cvPermission.AddChild(VCareerPermissions.CV.CreateOnline, L("Permission:CV.CreateOnline"));
        cvPermission.AddChild(VCareerPermissions.CV.Upload, L("Permission:CV.Upload"));
        cvPermission.AddChild(VCareerPermissions.CV.Update, L("Permission:CV.Update"));
        cvPermission.AddChild(VCareerPermissions.CV.Delete, L("Permission:CV.Delete"));
        cvPermission.AddChild(VCareerPermissions.CV.Get, L("Permission:CV.Get"));
        cvPermission.AddChild(VCareerPermissions.CV.SetDefault, L("Permission:CV.SetDefault"));
        cvPermission.AddChild(VCareerPermissions.CV.SetPublic, L("Permission:CV.SetPublic"));
        
        //Define your own permissions here. Example:
        //myGroup.AddPermission(VCareerPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<VCareerResource>(name);
    }
}
