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


            var jobPost = group.AddPermission(VCareerPermission.JobPost.Default, L("Permission:JobPost"));
            files.AddChild(VCareerPermission.JobPost.Create, L("Permission:JobPost.Create"));
            files.AddChild(VCareerPermission.JobPost.Update, L("Permission:JobPost.Update"));
            files.AddChild(VCareerPermission.JobPost.Delete, L("Permission:JobPost.Delete"));
            files.AddChild(VCareerPermission.JobPost.Approve, L("Permission:JobPost.Approve"));
            files.AddChild(VCareerPermission.JobPost.Reject, L("Permission:JobPost.Reject"));
            files.AddChild(VCareerPermission.JobPost.Statistics, L("Permission:JobPost.Statistics"));
            files.AddChild(VCareerPermission.JobPost.LoadJobNeedApprove, L("Permission:JobPost.LoadJobNeedApprove"));
            files.AddChild(VCareerPermission.JobPost.LoadJobByRecruiterId, L("Permission:JobPost.LoadJobByRecruiterId"));
            files.AddChild(VCareerPermission.JobPost.LoadJobByCompanyId, L("Permission:JobPost.LoadJobByCompanyId"));

            var recruitmentCampaign = group.AddPermission(VCareerPermission.RecruimentCampaign.Default, L("Permission:RecruimentCampaign"));
            files.AddChild(VCareerPermission.RecruimentCampaign.Create, L("Permission:RecruimentCampaign.Create"));
            files.AddChild(VCareerPermission.RecruimentCampaign.Delete, L("Permission:RecruimentCampaign.Delete"));
            files.AddChild(VCareerPermission.RecruimentCampaign.SetStatus, L("Permission:RecruimentCampaign.SetStatus"));
            files.AddChild(VCareerPermission.RecruimentCampaign.Update, L("Permission:RecruimentCampaign.Update"));
            files.AddChild(VCareerPermission.RecruimentCampaign.LoadJobOfRecruiment, L("Permission:RecruimentCampaign.LoadJobOfRecruiment"));
            files.AddChild(VCareerPermission.RecruimentCampaign.LoadRecruiment, L("Permission:RecruimentCampaign.LoadRecruiment"));

            var jobCategory = group.AddPermission(VCareerPermission.JobCategory.Default, L("Permission:JobCategory"));
            files.AddChild(VCareerPermission.JobCategory.Create, L("Permission:JobCategory.Create"));
            files.AddChild(VCareerPermission.JobCategory.Delete, L("Permission:JobCategory.Delete"));
            files.AddChild(VCareerPermission.JobCategory.Update, L("Permission:JobCategory.Update"));
            files.AddChild(VCareerPermission.JobCategory.View, L("Permission:JobCategory.View"));

            var tag = group.AddPermission(VCareerPermission.Tag.Default, L("Permission:JobCategory"));
            files.AddChild(VCareerPermission.JobCategory.Create, L("Permission:JobCategory.Create"));
            files.AddChild(VCareerPermission.JobCategory.Delete, L("Permission:JobCategory.Delete"));
            files.AddChild(VCareerPermission.JobCategory.Update, L("Permission:JobCategory.Update"));
            files.AddChild(VCareerPermission.JobCategory.View, L("Permission:JobCategory.View"));

            var subscriptionService = group.AddPermission(VCareerPermission.SubcriptionService.Default, L("Permission:SubscriptionService"));
            files.AddChild(VCareerPermission.SubcriptionService.Create, L("Permission:SubscriptionService.Create"));
            files.AddChild(VCareerPermission.SubcriptionService.Delete, L("Permission:SubscriptionService.Delete"));
            files.AddChild(VCareerPermission.SubcriptionService.Update, L("Permission:SubscriptionService.Update"));
            files.AddChild(VCareerPermission.SubcriptionService.AddChildService, L("Permission:SubscriptionService.AddChildService"));
            files.AddChild(VCareerPermission.SubcriptionService.Load, L("Permission:SubscriptionService.Load"));

            var subcriptionPrice = group.AddPermission(VCareerPermission.SubcriptionPrice.Default, L("Permission:SubscriptionPrice"));
            files.AddChild(VCareerPermission.SubcriptionPrice.Create, L("Permission:SubscriptionPrice.Create"));
            files.AddChild(VCareerPermission.SubcriptionPrice.Update, L("Permission:SubscriptionPrice.Update"));
            files.AddChild(VCareerPermission.SubcriptionPrice.Delete, L("Permission:SubscriptionPrice.Delete"));
            files.AddChild(VCareerPermission.SubcriptionPrice.SetStatus, L("Permission:SubscriptionPrice.SetStatus"));

            var childService = group.AddPermission(VCareerPermission.ChildService.Default, L("Permission:ChildService"));
            files.AddChild(VCareerPermission.ChildService.Create, L("Permission:ChildService.Create"));
            files.AddChild(VCareerPermission.ChildService.Delete, L("Permission:ChildService.Delete"));
            files.AddChild(VCareerPermission.ChildService.Load, L("Permission:ChildService.Load"));
            files.AddChild(VCareerPermission.ChildService.Remove, L("Permission:ChildService.Remove"));
            files.AddChild(VCareerPermission.ChildService.StopAgent, L("Permission:ChildService.StopAgent"));
            files.AddChild(VCareerPermission.ChildService.Update, L("Permission:ChildService.Update"));


        }

        private ILocalizableString? L(string name) => LocalizableString.Create<VCareerResource>(name);
    }
}
