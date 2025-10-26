using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using VCareer.Localization;

namespace VCareer.Application.Contracts.Permissions
{
    /// <summary>
    /// Provider để định nghĩa permissions
    /// </summary>
    public class VCareerPermissionDefinitionProvider : PermissionDefinitionProvider
    {
        public override void Define(IPermissionDefinitionContext context)
        {
            var vcareerGroup = context.AddGroup(VCareerPermissions.GroupName, L("Permission:VCareer"));

            // CV Management Permissions
            var cvPermission = vcareerGroup.AddPermission(VCareerPermissions.CV.Default, L("Permission:CV"));
            cvPermission.AddChild(VCareerPermissions.CV.CreateOnline, L("Permission:CV.CreateOnline"));
            cvPermission.AddChild(VCareerPermissions.CV.Upload, L("Permission:CV.Upload"));
            cvPermission.AddChild(VCareerPermissions.CV.Update, L("Permission:CV.Update"));
            cvPermission.AddChild(VCareerPermissions.CV.Delete, L("Permission:CV.Delete"));
            cvPermission.AddChild(VCareerPermissions.CV.Get, L("Permission:CV.Get"));
            cvPermission.AddChild(VCareerPermissions.CV.SetDefault, L("Permission:CV.SetDefault"));
            cvPermission.AddChild(VCareerPermissions.CV.SetPublic, L("Permission:CV.SetPublic"));

            // Application Management Permissions
            var applicationPermission = vcareerGroup.AddPermission(VCareerPermissions.Application.Default, L("Permission:Application"));
            applicationPermission.AddChild(VCareerPermissions.Application.Apply, L("Permission:Application.Apply"));
            applicationPermission.AddChild(VCareerPermissions.Application.View, L("Permission:Application.View"));
            applicationPermission.AddChild(VCareerPermissions.Application.Update, L("Permission:Application.Update"));
            applicationPermission.AddChild(VCareerPermissions.Application.Delete, L("Permission:Application.Delete"));
            applicationPermission.AddChild(VCareerPermissions.Application.Manage, L("Permission:Application.Manage"));
            applicationPermission.AddChild(VCareerPermissions.Application.Statistics, L("Permission:Application.Statistics"));
            applicationPermission.AddChild(VCareerPermissions.Application.DownloadCV, L("Permission:Application.DownloadCV"));
            applicationPermission.AddChild(VCareerPermissions.Application.Withdraw, L("Permission:Application.Withdraw"));

            // Profile Management Permissions
            var profilePermission = vcareerGroup.AddPermission(VCareerPermissions.Profile.Default, L("Permission:Profile"));
            profilePermission.AddChild(VCareerPermissions.Profile.View, L("Permission:Profile.View"));
            profilePermission.AddChild(VCareerPermissions.Profile.Update, L("Permission:Profile.Update"));
            profilePermission.AddChild(VCareerPermissions.Profile.Delete, L("Permission:Profile.Delete"));
        }

        private static LocalizableString L(string name)
        {
            return LocalizableString.Create<VCareerResource>(name);
        }
    }
}

