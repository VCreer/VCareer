using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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
            files.AddChild(VCareerPermission.Files.View, L("Permission:View"));
            files.AddChild(VCareerPermission.Files.Update, L("Permission:Update"));
            files.AddChild(VCareerPermission.Files.Upload, L("Permission:Upload"));
            files.AddChild(VCareerPermission.Files.Delete, L("Permission:Delete"));
            files.AddChild(VCareerPermission.Files.Download, L("Permission:Dowload"));

        }

        private ILocalizableString? L(string name) => LocalizableString.Create<VCareerResource>(name);
    }
}
