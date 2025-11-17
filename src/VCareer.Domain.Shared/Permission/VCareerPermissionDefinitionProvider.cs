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

            // CV Template Permissions (chủ yếu cho Admin)
            var cvTemplatePermission = group.AddPermission(VCareerPermission.CvTemplate.Default, L("Permission:CvTemplate"));
            cvTemplatePermission.AddChild(VCareerPermission.CvTemplate.Create, L("Permission:CvTemplate.Create"));
            cvTemplatePermission.AddChild(VCareerPermission.CvTemplate.Update, L("Permission:CvTemplate.Update"));
            cvTemplatePermission.AddChild(VCareerPermission.CvTemplate.Delete, L("Permission:CvTemplate.Delete"));
            cvTemplatePermission.AddChild(VCareerPermission.CvTemplate.Get, L("Permission:CvTemplate.Get"));
            cvTemplatePermission.AddChild(VCareerPermission.CvTemplate.GetList, L("Permission:CvTemplate.GetList"));
            cvTemplatePermission.AddChild(VCareerPermission.CvTemplate.GetActiveTemplates, L("Permission:CvTemplate.GetActiveTemplates"));

            // Candidate CV Permissions (cho Candidate)
            var candidateCvPermission = group.AddPermission(VCareerPermission.CandidateCv.Default, L("Permission:CandidateCv"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.Create, L("Permission:CandidateCv.Create"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.Update, L("Permission:CandidateCv.Update"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.Delete, L("Permission:CandidateCv.Delete"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.Get, L("Permission:CandidateCv.Get"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.GetList, L("Permission:CandidateCv.GetList"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.Render, L("Permission:CandidateCv.Render"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.SetDefault, L("Permission:CandidateCv.SetDefault"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.Publish, L("Permission:CandidateCv.Publish"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.IncrementViewCount, L("Permission:CandidateCv.IncrementViewCount"));
            candidateCvPermission.AddChild(VCareerPermission.CandidateCv.GetDefault, L("Permission:CandidateCv.GetDefault"));

            var dashboardPermission = group.AddPermission(VCareerPermission.Dashboard.Default, L("Permission:Dashboard"));
            dashboardPermission.AddChild(VCareerPermission.Dashboard.ViewCompanyDashboard, L("Permission:Dashboard.ViewCompanyDashboard"));
            dashboardPermission.AddChild(VCareerPermission.Dashboard.ViewStaffPerformance, L("Permission:Dashboard.ViewStaffPerformance"));
            dashboardPermission.AddChild(VCareerPermission.Dashboard.ViewActivityTrend, L("Permission:Dashboard.ViewActivityTrend"));
            dashboardPermission.AddChild(VCareerPermission.Dashboard.ViewTopPerformers, L("Permission:Dashboard.ViewTopPerformers"));
            dashboardPermission.AddChild(VCareerPermission.Dashboard.CompareStaffPerformance, L("Permission:Dashboard.CompareStaffPerformance"));

            // Application Permissions
            var applicationPermission = group.AddPermission(VCareerPermission.Application.Default, L("Permission:Application"));
            applicationPermission.AddChild(VCareerPermission.Application.Apply, L("Permission:Application.Apply"));
            applicationPermission.AddChild(VCareerPermission.Application.View, L("Permission:Application.View"));
            applicationPermission.AddChild(VCareerPermission.Application.Update, L("Permission:Application.Update"));
            applicationPermission.AddChild(VCareerPermission.Application.Delete, L("Permission:Application.Delete"));
            applicationPermission.AddChild(VCareerPermission.Application.Manage, L("Permission:Application.Manage"));
            applicationPermission.AddChild(VCareerPermission.Application.Statistics, L("Permission:Application.Statistics"));
            applicationPermission.AddChild(VCareerPermission.Application.DownloadCV, L("Permission:Application.DownloadCV"));
            applicationPermission.AddChild(VCareerPermission.Application.Withdraw, L("Permission:Application.Withdraw"));

            
        }

        private ILocalizableString? L(string name) => LocalizableString.Create<VCareerResource>(name);
    }
}
