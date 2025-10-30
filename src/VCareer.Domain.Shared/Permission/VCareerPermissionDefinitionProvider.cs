using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VCareer.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace VCareer.Permission
{
    //permission là phải cho đầy đủ vào đây, UI ko có phần tạo permission 
    public class VCareerPermissionDefinitionProvider : PermissionDefinitionProvider
    {
        public override void Define(IPermissionDefinitionContext context)
        {
            var group = context.AddGroup(VCareerPermission.GroupName, L("Permission:VCareer"));

            var files = group.AddPermission(VCareerPermission.Files.Default, L("Permission:Files"));
            files.AddChild(VCareerPermission.Files.View, L("Permission:File.View"));
            files.AddChild(VCareerPermission.Files.Update, L("Permission:File.Update"));
            files.AddChild(VCareerPermission.Files.Upload, L("Permission:File.Upload"));
            files.AddChild(VCareerPermission.Files.Delete, L("Permission:File.Delete"));
            files.AddChild(VCareerPermission.Files.Download, L("Permission:File.Dowload"));

            var profilePermission = group.AddPermission(VCareerPermission.Profile.Default, L("Permission:Profile"));
            profilePermission.AddChild(VCareerPermission.Profile.UpdatePersonalInfo, L("Permission:Profile.UpdatePersonalInfo"));
            profilePermission.AddChild(VCareerPermission.Profile.ChangePassword, L("Permission:Profile.ChangePassword"));
            profilePermission.AddChild(VCareerPermission.Profile.DeleteAccount, L("Permission:Profile.DeleteAccount"));
            profilePermission.AddChild(VCareerPermission.Profile.SubmitLegalInformation, L("Permission:Profile.SubmitLegalInformation"));
            profilePermission.AddChild(VCareerPermission.Profile.UpdateLegalInformation, L("Permission:Profile.UpdateLegalInformation"));
            profilePermission.AddChild(VCareerPermission.Profile.UploadSupportingDocument, L("Permission:Profile.UploadSupportingDocument"));
            profilePermission.AddChild(VCareerPermission.Profile.UpdateSupportingDocument, L("Permission:Profile.UpdateSupportingDocument"));
            profilePermission.AddChild(VCareerPermission.Profile.DeleteSupportingDocument, L("Permission:Profile.DeleteSupportingDocument"));
            profilePermission.AddChild(VCareerPermission.Profile.DownloadSupportingDocument, L("Permission:Profile.DownloadSupportingDocument"));

            var cvPermission = group.AddPermission(VCareerPermission.CV.Default, L("Permission:CV"));
            cvPermission.AddChild(VCareerPermission.CV.CreateOnline, L("Permission:CV.CreateOnline"));
            cvPermission.AddChild(VCareerPermission.CV.Upload, L("Permission:CV.Upload"));
            cvPermission.AddChild(VCareerPermission.CV.Update, L("Permission:CV.Update"));
            cvPermission.AddChild(VCareerPermission.CV.Delete, L("Permission:CV.Delete"));
            cvPermission.AddChild(VCareerPermission.CV.Get, L("Permission:CV.Get"));
            cvPermission.AddChild(VCareerPermission.CV.SetDefault, L("Permission:CV.SetDefault"));
            cvPermission.AddChild(VCareerPermission.CV.SetPublic, L("Permission:CV.SetPublic"));


            /*var applicationPermission = group.AddPermission(VCareerPermission.Application.Default, L("Permission:Application"));
            applicationPermission.AddChild(VCareerPermission.Application.Apply, L("Permission:Application.Apply"));
            applicationPermission.AddChild(VCareerPermission.Application.View, L("Permission:Application.View"));
            applicationPermission.AddChild(VCareerPermission.Application.Update, L("Permission:Application.Update"));
            applicationPermission.AddChild(VCareerPermission.Application.Delete, L("Permission:Application.Delete"));
            applicationPermission.AddChild(VCareerPermission.Application.Manage, L("Permission:Application.Manage"));
            applicationPermission.AddChild(VCareerPermission.Application.Statistics, L("Permission:Application.Statistics"));
            applicationPermission.AddChild(VCareerPermission.Application.DownloadCV, L("Permission:Application.DownloadCV"));
            applicationPermission.AddChild(VCareerPermission.Application.Withdraw, L("Permission:Application.Withdraw"));*/
        }

        private ILocalizableString? L(string name) => LocalizableString.Create<VCareerResource>(name);
    }
}
