using System;
using VCareer.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace VCareer.Permission
{
    public class VCareerPermissionDefinitionProvider : PermissionDefinitionProvider
    {
        public override void Define(IPermissionDefinitionContext context)
        {
            var group = context.AddGroup(VCareerPermission.GroupName, L("Permission:VCareer"));

            // ===================== FILES =====================
            var files = group.AddPermission(VCareerPermission.Files.Default, L("Permission:Files"));
            files.AddChild(VCareerPermission.Files.View, L("Permission:File.View"));
            files.AddChild(VCareerPermission.Files.Update, L("Permission:File.Update"));
            files.AddChild(VCareerPermission.Files.Upload, L("Permission:File.Upload"));
            files.AddChild(VCareerPermission.Files.Delete, L("Permission:File.Delete"));
            files.AddChild(VCareerPermission.Files.Download, L("Permission:File.Download"));

            // ===================== PROFILE =====================
            var profile = group.AddPermission(VCareerPermission.Profile.Default, L("Permission:Profile"));
            profile.AddChild(VCareerPermission.Profile.UpdatePersonalInfo, L("Permission:Profile.UpdatePersonalInfo"));
            profile.AddChild(VCareerPermission.Profile.ChangePassword, L("Permission:Profile.ChangePassword"));
            profile.AddChild(VCareerPermission.Profile.DeleteAccount, L("Permission:Profile.DeleteAccount"));
            profile.AddChild(VCareerPermission.Profile.SubmitLegalInformation, L("Permission:Profile.SubmitLegalInformation"));
            profile.AddChild(VCareerPermission.Profile.UpdateLegalInformation, L("Permission:Profile.UpdateLegalInformation"));
            profile.AddChild(VCareerPermission.Profile.UploadSupportingDocument, L("Permission:Profile.UploadSupportingDocument"));
            profile.AddChild(VCareerPermission.Profile.UpdateSupportingDocument, L("Permission:Profile.UpdateSupportingDocument"));
            profile.AddChild(VCareerPermission.Profile.DeleteSupportingDocument, L("Permission:Profile.DeleteSupportingDocument"));
            profile.AddChild(VCareerPermission.Profile.DownloadSupportingDocument, L("Permission:Profile.DownloadSupportingDocument"));

            // ===================== CV TEMPLATE =====================
            var cvTemplate = group.AddPermission(VCareerPermission.CvTemplate.Default, L("Permission:CvTemplate"));
            cvTemplate.AddChild(VCareerPermission.CvTemplate.Create, L("Permission:CvTemplate.Create"));
            cvTemplate.AddChild(VCareerPermission.CvTemplate.Update, L("Permission:CvTemplate.Update"));
            cvTemplate.AddChild(VCareerPermission.CvTemplate.Delete, L("Permission:CvTemplate.Delete"));
            cvTemplate.AddChild(VCareerPermission.CvTemplate.Get, L("Permission:CvTemplate.Get"));
            cvTemplate.AddChild(VCareerPermission.CvTemplate.GetList, L("Permission:CvTemplate.GetList"));
            cvTemplate.AddChild(VCareerPermission.CvTemplate.GetActiveTemplates, L("Permission:CvTemplate.GetActiveTemplates"));

            // ===================== CANDIDATE CV =====================
            var candidateCv = group.AddPermission(VCareerPermission.CandidateCv.Default, L("Permission:CandidateCv"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.Create, L("Permission:CandidateCv.Create"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.Update, L("Permission:CandidateCv.Update"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.Delete, L("Permission:CandidateCv.Delete"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.Get, L("Permission:CandidateCv.Get"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.GetList, L("Permission:CandidateCv.GetList"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.Render, L("Permission:CandidateCv.Render"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.SetDefault, L("Permission:CandidateCv.SetDefault"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.Publish, L("Permission:CandidateCv.Publish"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.IncrementViewCount, L("Permission:CandidateCv.IncrementViewCount"));
            candidateCv.AddChild(VCareerPermission.CandidateCv.GetDefault, L("Permission:CandidateCv.GetDefault"));

            // ===================== DASHBOARD =====================
            //var dashboard = group.AddPermission(VCareerPermission.Dashboard.Default, L("Permission:Dashboard"));
            //dashboard.AddChild(VCareerPermission.Dashboard.ViewCompanyDashboard, L("Permission:Dashboard.ViewCompanyDashboard"));
            //dashboard.AddChild(VCareerPermission.Dashboard.ViewStaffPerformance, L("Permission:Dashboard.ViewStaffPerformance"));
            //dashboard.AddChild(VCareerPermission.Dashboard.ViewActivityTrend, L("Permission:Dashboard.ViewActivityTrend"));
            //dashboard.AddChild(VCareerPermission.Dashboard.ViewTopPerformers, L("Permission:Dashboard.ViewTopPerformers"));
            //dashboard.AddChild(VCareerPermission.Dashboard.CompareStaffPerformance, L("Permission:Dashboard.CompareStaffPerformance"));

            // ===================== APPLICATION =====================
            var application = group.AddPermission(VCareerPermission.Application.Default, L("Permission:Application"));
            application.AddChild(VCareerPermission.Application.Apply, L("Permission:Application.Apply"));
            application.AddChild(VCareerPermission.Application.View, L("Permission:Application.View"));
            application.AddChild(VCareerPermission.Application.Update, L("Permission:Application.Update"));
            application.AddChild(VCareerPermission.Application.Delete, L("Permission:Application.Delete"));
            application.AddChild(VCareerPermission.Application.Manage, L("Permission:Application.Manage"));
            application.AddChild(VCareerPermission.Application.Statistics, L("Permission:Application.Statistics"));
            application.AddChild(VCareerPermission.Application.DownloadCV, L("Permission:Application.DownloadCV"));
            application.AddChild(VCareerPermission.Application.Withdraw, L("Permission:Application.Withdraw"));

            // ===================== JOB POST =====================
            var jobPost = group.AddPermission(VCareerPermission.JobPost.Default, L("Permission:JobPost"));
            jobPost.AddChild(VCareerPermission.JobPost.Create, L("Permission:JobPost.Create"));
            jobPost.AddChild(VCareerPermission.JobPost.Update, L("Permission:JobPost.Update"));
            jobPost.AddChild(VCareerPermission.JobPost.CLose, L("Permission:JobPost.Close"));
            jobPost.AddChild(VCareerPermission.JobPost.PostJob, L("Permission:JobPost.PostJob"));
            jobPost.AddChild(VCareerPermission.JobPost.Delete, L("Permission:JobPost.Delete"));
            jobPost.AddChild(VCareerPermission.JobPost.Approve, L("Permission:JobPost.Approve"));
            jobPost.AddChild(VCareerPermission.JobPost.Reject, L("Permission:JobPost.Reject"));
            jobPost.AddChild(VCareerPermission.JobPost.Statistics, L("Permission:JobPost.Statistics"));
            jobPost.AddChild(VCareerPermission.JobPost.LoadJobNeedApprove, L("Permission:JobPost.LoadJobNeedApprove"));
            jobPost.AddChild(VCareerPermission.JobPost.LoadJobByRecruiterId, L("Permission:JobPost.LoadJobByRecruiterId"));
            jobPost.AddChild(VCareerPermission.JobPost.LoadJobByCompanyId, L("Permission:JobPost.LoadJobByCompanyId"));

            // ===================== RECRUITMENT CAMPAIGN =====================
            var recruitment = group.AddPermission(VCareerPermission.RecruimentCampaign.Default, L("Permission:RecruimentCampaign"));
            recruitment.AddChild(VCareerPermission.RecruimentCampaign.Create, L("Permission:RecruimentCampaign.Create"));
            recruitment.AddChild(VCareerPermission.RecruimentCampaign.Delete, L("Permission:RecruimentCampaign.Delete"));
            recruitment.AddChild(VCareerPermission.RecruimentCampaign.SetStatus, L("Permission:RecruimentCampaign.SetStatus"));
            recruitment.AddChild(VCareerPermission.RecruimentCampaign.Update, L("Permission:RecruimentCampaign.Update"));
            recruitment.AddChild(VCareerPermission.RecruimentCampaign.LoadJobOfRecruiment, L("Permission:RecruimentCampaign.LoadJobOfRecruiment"));
            recruitment.AddChild(VCareerPermission.RecruimentCampaign.LoadRecruiment, L("Permission:RecruimentCampaign.LoadRecruiment"));

            // ===================== JOB CATEGORY =====================
            var jobCategory = group.AddPermission(VCareerPermission.JobCategory.Default, L("Permission:JobCategory"));
            jobCategory.AddChild(VCareerPermission.JobCategory.Create, L("Permission:JobCategory.Create"));
            jobCategory.AddChild(VCareerPermission.JobCategory.Delete, L("Permission:JobCategory.Delete"));
            jobCategory.AddChild(VCareerPermission.JobCategory.Update, L("Permission:JobCategory.Update"));
            jobCategory.AddChild(VCareerPermission.JobCategory.View, L("Permission:JobCategory.View"));

            // ===================== TAG =====================
            var tag = group.AddPermission(VCareerPermission.Tag.Default, L("Permission:Tag"));
            tag.AddChild(VCareerPermission.Tag.Create, L("Permission:Tag.Create"));
            tag.AddChild(VCareerPermission.Tag.Delete, L("Permission:Tag.Delete"));
            tag.AddChild(VCareerPermission.Tag.Update, L("Permission:Tag.Update"));
            tag.AddChild(VCareerPermission.Tag.View, L("Permission:Tag.View"));

            // ===================== SUBSCRIPTION SERVICE =====================
            var subscription = group.AddPermission(VCareerPermission.SubcriptionService.Default, L("Permission:SubscriptionService"));
            subscription.AddChild(VCareerPermission.SubcriptionService.Create, L("Permission:SubscriptionService.Create"));
            subscription.AddChild(VCareerPermission.SubcriptionService.Buy, L("Permission:SubscriptionService.Buy"));
            subscription.AddChild(VCareerPermission.SubcriptionService.Delete, L("Permission:SubscriptionService.Delete"));
            subscription.AddChild(VCareerPermission.SubcriptionService.Update, L("Permission:SubscriptionService.Update"));
            subscription.AddChild(VCareerPermission.SubcriptionService.AddChildService, L("Permission:SubscriptionService.AddChildService"));
            subscription.AddChild(VCareerPermission.SubcriptionService.RemoveChildService, L("Permission:SubscriptionService.RemoveChildService"));
            subscription.AddChild(VCareerPermission.SubcriptionService.Load, L("Permission:SubscriptionService.Load"));
            subscription.AddChild(VCareerPermission.SubcriptionService.LoadChildService, L("Permission:SubscriptionService.LoadChildService"));

            // ===================== SUBSCRIPTION PRICE =====================
            var price = group.AddPermission(VCareerPermission.SubcriptionPrice.Default, L("Permission:SubscriptionPrice"));
            price.AddChild(VCareerPermission.SubcriptionPrice.Create, L("Permission:SubscriptionPrice.Create"));
            price.AddChild(VCareerPermission.SubcriptionPrice.Load, L("Permission:SubscriptionPrice.Load"));
            price.AddChild(VCareerPermission.SubcriptionPrice.Update, L("Permission:SubscriptionPrice.Update"));
            price.AddChild(VCareerPermission.SubcriptionPrice.Delete, L("Permission:SubscriptionPrice.Delete"));
            price.AddChild(VCareerPermission.SubcriptionPrice.SetStatus, L("Permission:SubscriptionPrice.SetStatus"));

            // ===================== CHILD SERVICE =====================
            var childService = group.AddPermission(VCareerPermission.ChildService.Default, L("Permission:ChildService"));
            childService.AddChild(VCareerPermission.ChildService.Create, L("Permission:ChildService.Create"));
            childService.AddChild(VCareerPermission.ChildService.Delete, L("Permission:ChildService.Delete"));
            childService.AddChild(VCareerPermission.ChildService.Load, L("Permission:ChildService.Load"));
            childService.AddChild(VCareerPermission.ChildService.Remove, L("Permission:ChildService.Remove"));
            childService.AddChild(VCareerPermission.ChildService.StopAgent, L("Permission:ChildService.StopAgent"));
            childService.AddChild(VCareerPermission.ChildService.Update, L("Permission:ChildService.Update"));

            // ===================== CART =====================
            var cart = group.AddPermission(VCareerPermission.Cart.Default, L("Permission:Cart"));
            cart.AddChild(VCareerPermission.Cart.AddToCart, L("Permission:Cart.AddToCart"));
            cart.AddChild(VCareerPermission.Cart.Update, L("Permission:Cart.Update"));
            cart.AddChild(VCareerPermission.Cart.Delete, L("Permission:Cart.Delete"));
            cart.AddChild(VCareerPermission.Cart.View, L("Permission:Cart.View"));
            cart.AddChild(VCareerPermission.Cart.Clear, L("Permission:Cart.Clear"));

            // ===================== TEAM MANAGEMENT =====================
            var team = group.AddPermission(VCareerPermission.TeamManagement.Default, L("Permission:TeamManagement"));
                     team.AddChild(VCareerPermission.TeamManagement.GetAllStaff, L("Permission:TeamManagement.GetAllStaff"));
            team.AddChild(VCareerPermission.TeamManagement.DeactivateStaff, L("Permission:TeamManagement.DeactivateStaff"));
            team.AddChild(VCareerPermission.TeamManagement.ActivateStaff, L("Permission:TeamManagement.ActivateStaff"));
            team.AddChild(VCareerPermission.TeamManagement.InviteStaff, L("Permission:TeamManagement.InviteStaff"));

            // ===================== COMPANY VERIFICATION =====================
            var company = group.AddPermission(VCareerPermission.CompanyVerification.Default, L("Permission:CompanyVerification"));
            company.AddChild(VCareerPermission.CompanyVerification.ViewPendingCompanies, L("Permission:CompanyVerification.ViewPendingCompanies"));
            company.AddChild(VCareerPermission.CompanyVerification.ApproveCompany, L("Permission:CompanyVerification.ApproveCompany"));
            company.AddChild(VCareerPermission.CompanyVerification.RejectCompany, L("Permission:CompanyVerification.RejectCompany"));
            company.AddChild(VCareerPermission.CompanyVerification.ViewVerifiedCompanies, L("Permission:CompanyVerification.ViewVerifiedCompanies"));
            company.AddChild(VCareerPermission.CompanyVerification.ViewRejectedCompanies, L("Permission:CompanyVerification.ViewRejectedCompanies"));
            company.AddChild(VCareerPermission.CompanyVerification.UploadLegalDocument, L("Permission:CompanyVerification.UploadLegalDocument"));
            company.AddChild(VCareerPermission.CompanyVerification.DownloadLegalDocument, L("Permission:CompanyVerification.DownloadLegalDocument"));
            company.AddChild(VCareerPermission.CompanyVerification.View, L("Permission:CompanyVerification.View"));

            // ===================== User=====================
            var user = group.AddPermission(VCareerPermission.User.Default, L("Permission:UserManagement"));
            user.AddChild(VCareerPermission.User.CreateEmpLoyeeAccount, L("Permission:UserManagement.CreateEmployeeAccount"));
            user.AddChild(VCareerPermission.User.ViewByRole, L("Permission:UserManagement.ViewByRole"));
            user.AddChild(VCareerPermission.User.SetStatus, L("Permission:UserManagement.SetStatus"));
        }

        private ILocalizableString L(string name)
        {
            return LocalizableString.Create<VCareerResource>(name);
        }
    }
}
