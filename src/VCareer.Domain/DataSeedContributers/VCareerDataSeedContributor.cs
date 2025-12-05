using Org.BouncyCastle.Asn1;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.Authentication;
using VCareer.Permission;
using Volo.Abp.Authorization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace VCareer.DataSeedContributers
{
    public class VCareerDataSeedContributor : IDataSeedContributor, ITransientDependency
    {
        private readonly IdentityRoleManager _roleManager;
        private readonly IPermissionManager _permissionManager;
        private const string ACCOUNT_EMPLOYEE = "account_employee";
        private const string FINANCE_EMPLOYEE = "finance_employee";
        private const string SYSTEM_EMPLOYEE = "system_employee";
        private const string LEAD_RECRUITER = "lead_recruiter";
        private const string HR_STAFF = "hr_staff";
        private const string CANDIDATE = "candidate";

        public VCareerDataSeedContributor(IdentityRoleManager roleManager, IPermissionManager permissionManager)
        {
            _roleManager = roleManager;
            _permissionManager = permissionManager;
        }
        public async Task SeedAsync(DataSeedContext context)
        {
            await SeedRoleAsync();
            await SeedPermissionsGroupAsync(SYSTEM_EMPLOYEE, "AbpIdentity");
        }


        #region helper
        private async Task SeedRoleAsync()
        {
            foreach (var item in rolePermissionsDict)
            {
                var role = await _roleManager.FindByNameAsync(item.Key);
                if (role == null)
                {
                    role = new IdentityRole(Guid.NewGuid(), item.Key);
                    await _roleManager.CreateAsync(role);
                }

                if (item.Value != null)
                {
                    foreach (var permission in item.Value)
                    {
                        await _permissionManager.SetAsync(
                         permission,
                         RolePermissionValueProvider.ProviderName,
                         role.Name, true
);
                    }
                }
            }
        }
        // hàm này check goupname là chỉ check trong tên thằng permission có contain chữ groupname ko
        private async Task SeedPermissionsGroupAsync(string roleName, string groupName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return;

            // Lấy tất cả permission đã đăng ký
            var allPermissions = await _permissionManager.GetAllAsync(null, null);

            // Lọc permission theo group và chỉ gán được cho role (Providers chứa "R")
            var groupPermissions = allPermissions
      .Where(p => p.Name.StartsWith(groupName))
      .ToList();

            foreach (var permission in groupPermissions)
            {
                if (permission.Name.Contains("UserLookup")) continue;
                await _permissionManager.SetAsync(
                    permission.Name,
                    RolePermissionValueProvider.ProviderName,
                    role.Name,
                    true
                );
            }
        }


        #endregion

        private readonly Dictionary<string, string[]> rolePermissionsDict = new Dictionary<string, string[]>()
{
    //candidate
    {
        CANDIDATE,
        FilePermissions
            .Concat(ProfilePermissions)
            .Concat(Candidate_CvTemplatePermissions)
            .Concat(CandidateCvPermissions)
            .Concat(CartPermissions)
            .Concat(Candidate_ApplicationPermissions)
            .Concat(Common_JobCategoryPermissions)
            .Concat(Common_TagPermissions)
            .Concat(Common_SubcriptionServicePermissions)
            .ToArray()
    },

    //Lead recruiter
    {
        LEAD_RECRUITER,
        FilePermissions
            .Concat(ProfilePermissions)
            .Concat(CartPermissions)
            .Concat(Recruiter_ApplicationPermissions)
            .Concat(Recruiter_JobPostPermissions)
            .Concat(RecruimentCampaignPermissions)
            .Concat(Common_JobCategoryPermissions)
            .Concat(Common_TagPermissions)
            .Concat(Common_SubcriptionServicePermissions)
            .Concat(TeamManagementPermissions)
            .Concat(Recruiter_CompanyVerificationPermissions)
            .ToArray()
    },

    //hr staff
    {
        HR_STAFF,
        FilePermissions
            .Concat(Recruiter_ApplicationPermissions)
            .Concat(Recruiter_JobPostPermissions)
            .Concat(RecruimentCampaignPermissions)
            .Concat(Common_JobCategoryPermissions)
            .Concat(Common_TagPermissions)
            .ToArray()
    },

    //system employee
    {
        SYSTEM_EMPLOYEE,
        FilePermissions
            .Concat(Employee_CvTemplatePermissions)
            .Concat(Employee_JobPostPermissions)
            .Concat(Employee_JobCategoryPermissions)
            .Concat(Employee_TagPermissions)
            .ToArray()
    },
    
    //finance employee
    {
        FINANCE_EMPLOYEE,
        FilePermissions
            .Concat(SubcriptionPricePermissions)
            .Concat(ChildServicePermissions)
            .Concat(Employee_SubcriptionServicePermissions)
            .ToArray()
    },

    //account employee
    {
        ACCOUNT_EMPLOYEE,
        FilePermissions
            .Concat(UserPermissions)
            .Concat(Employee_CompanyVerificationPermissions)
            .ToArray()
    }
};
        #region  group Permission

        private static string[] FilePermissions = new[]
        {
    VCareerPermission.Files.Default,
    VCareerPermission.Files.View,
    VCareerPermission.Files.Delete,
    VCareerPermission.Files.Download,
    VCareerPermission.Files.Update,
    VCareerPermission.Files.Upload
};

        private static string[] ProfilePermissions = new[]
        {
    VCareerPermission.Profile.Default,
    VCareerPermission.Profile.UpdatePersonalInfo,
    VCareerPermission.Profile.ChangePassword,
    VCareerPermission.Profile.DeleteAccount,
    VCareerPermission.Profile.SubmitLegalInformation,
    VCareerPermission.Profile.UpdateLegalInformation,
    VCareerPermission.Profile.UploadSupportingDocument,
    VCareerPermission.Profile.UpdateSupportingDocument,
    VCareerPermission.Profile.DeleteSupportingDocument,
    VCareerPermission.Profile.DownloadSupportingDocument
};

        private static string[] Candidate_CvTemplatePermissions = new[]
        {
      VCareerPermission.CvTemplate.Default,
      VCareerPermission.CvTemplate.Get,
      VCareerPermission.CvTemplate.GetActiveTemplates
};
        private static string[] Employee_CvTemplatePermissions = new[]
     {
   VCareerPermission.CvTemplate.Default,
    VCareerPermission.CvTemplate.Create,
    VCareerPermission.CvTemplate.Update,
    VCareerPermission.CvTemplate.Delete,
    VCareerPermission.CvTemplate.Get,
    VCareerPermission.CvTemplate.GetList,
    VCareerPermission.CvTemplate.GetActiveTemplates
};

        private static string[] CandidateCvPermissions = new[]
        {
    VCareerPermission.CandidateCv.Default,
    VCareerPermission.CandidateCv.Create,
    VCareerPermission.CandidateCv.Update,
    VCareerPermission.CandidateCv.Delete,
    VCareerPermission.CandidateCv.Get,
    VCareerPermission.CandidateCv.GetList,
    VCareerPermission.CandidateCv.Render,
    VCareerPermission.CandidateCv.SetDefault,
    VCareerPermission.CandidateCv.Publish,
    VCareerPermission.CandidateCv.IncrementViewCount,
    VCareerPermission.CandidateCv.GetDefault
};

        private static string[] CartPermissions = new[]
        {
    VCareerPermission.Cart.Default,
    VCareerPermission.Cart.AddToCart,
    VCareerPermission.Cart.Clear,
    VCareerPermission.Cart.Update,
    VCareerPermission.Cart.Delete,
    VCareerPermission.Cart.View
};

        private static string[] Candidate_ApplicationPermissions = new[]
        {
    VCareerPermission.Application.Default,
    VCareerPermission.Application.Apply,
     VCareerPermission.Application.DownloadCV,
 };
        private static string[] Recruiter_ApplicationPermissions = new[]
{
    VCareerPermission.Application.Default,
     VCareerPermission.Application.View,
    VCareerPermission.Application.Update,
    VCareerPermission.Application.Delete,
    VCareerPermission.Application.Manage,
    VCareerPermission.Application.Statistics,
    VCareerPermission.Application.DownloadCV,
    VCareerPermission.Application.Withdraw
};

        private static string[] Recruiter_JobPostPermissions = new[]
        {
    VCareerPermission.JobPost.Default,
    VCareerPermission.JobPost.Delete,
    VCareerPermission.JobPost.Create,
    VCareerPermission.JobPost.Update,
    VCareerPermission.JobPost.CLose,
    VCareerPermission.JobPost.PostJob,
       VCareerPermission.JobPost.Statistics,
     VCareerPermission.JobPost.LoadJobByRecruiterId,
    VCareerPermission.JobPost.LoadJobByCompanyId,
 };
        private static string[] Employee_JobPostPermissions = new[]
   {
    VCareerPermission.JobPost.Default,
     VCareerPermission.JobPost.Approve,
     VCareerPermission.JobPost.Reject,
    VCareerPermission.JobPost.LoadJobByRecruiterId,
    VCareerPermission.JobPost.LoadJobByCompanyId,
    VCareerPermission.JobPost.LoadJobNeedApprove
};

        private static string[] RecruimentCampaignPermissions = new[]
        {
    VCareerPermission.RecruimentCampaign.Default,
    VCareerPermission.RecruimentCampaign.Delete,
    VCareerPermission.RecruimentCampaign.Create,
    VCareerPermission.RecruimentCampaign.Update,
    VCareerPermission.RecruimentCampaign.LoadRecruiment,
    VCareerPermission.RecruimentCampaign.LoadJobOfRecruiment,
    VCareerPermission.RecruimentCampaign.SetStatus
};

        private static string[] Employee_JobCategoryPermissions = new[]
        {
    VCareerPermission.JobCategory.Default,
    VCareerPermission.JobCategory.Delete,
    VCareerPermission.JobCategory.View,
    VCareerPermission.JobCategory.Create,
    VCareerPermission.JobCategory.Update
};
        private static string[] Common_JobCategoryPermissions = new[]
    {
    VCareerPermission.JobCategory.Default,
     VCareerPermission.JobCategory.View,
};

        private static string[] Employee_TagPermissions = new[]
        {
    VCareerPermission.Tag.Default,
    VCareerPermission.Tag.Delete,
    VCareerPermission.Tag.Create,
    VCareerPermission.Tag.Update,
    VCareerPermission.Tag.View
};
        private static string[] Common_TagPermissions = new[]
   {
    VCareerPermission.Tag.Default,
    VCareerPermission.Tag.View
};

        private static string[] Common_SubcriptionServicePermissions = new[]
        {
    VCareerPermission.SubcriptionService.Default,
    VCareerPermission.SubcriptionService.Buy,
     VCareerPermission.SubcriptionService.Load,
};

        private static string[] Employee_SubcriptionServicePermissions = new[]
        {
    VCareerPermission.SubcriptionService.Default,
    VCareerPermission.SubcriptionService.Delete,
    VCareerPermission.SubcriptionService.Create,
    VCareerPermission.SubcriptionService.Update,
    VCareerPermission.SubcriptionService.AddChildService,
    VCareerPermission.SubcriptionService.RemoveChildService,
    VCareerPermission.SubcriptionService.Load,
    VCareerPermission.SubcriptionService.LoadChildService
};

        private static string[] ChildServicePermissions = new[]
        {
    VCareerPermission.ChildService.Default,
    VCareerPermission.ChildService.Delete,
    VCareerPermission.ChildService.Remove,
    VCareerPermission.ChildService.Create,
    VCareerPermission.ChildService.Update,
    VCareerPermission.ChildService.StopAgent,
    VCareerPermission.ChildService.Load
};

        private static string[] SubcriptionPricePermissions = new[]
        {
    VCareerPermission.SubcriptionPrice.Default,
    VCareerPermission.SubcriptionPrice.Delete,
    VCareerPermission.SubcriptionPrice.Load,
    VCareerPermission.SubcriptionPrice.Create,
    VCareerPermission.SubcriptionPrice.Update,
    VCareerPermission.SubcriptionPrice.SetStatus
};

        private static string[] UserPermissions = new[]
        {
    VCareerPermission.User.Default,
    VCareerPermission.User.CreateEmpLoyeeAccount,
    VCareerPermission.User.ViewByRole,
    VCareerPermission.User.ViewEmployees,
    VCareerPermission.User.SetStatus
};

        private static string[] LoggingPermissions = new[]
        {
    VCareerPermission.Logging.Default
};

        private static string[] TeamManagementPermissions = new[]
        {
    VCareerPermission.TeamManagement.Default,
    VCareerPermission.TeamManagement.GetAllStaff,
    VCareerPermission.TeamManagement.DeactivateStaff,
    VCareerPermission.TeamManagement.ActivateStaff,
    VCareerPermission.TeamManagement.InviteStaff
};

        private static string[] Recruiter_CompanyVerificationPermissions = new[]
        {
    VCareerPermission.CompanyVerification.Default,
    VCareerPermission.CompanyVerification.View,
    VCareerPermission.CompanyVerification.UploadLegalDocument,
    VCareerPermission.CompanyVerification.DownloadLegalDocument
};

        private static string[] Employee_CompanyVerificationPermissions = new[]
        {
    VCareerPermission.CompanyVerification.Default,
    VCareerPermission.CompanyVerification.ViewPendingCompanies,
    VCareerPermission.CompanyVerification.View,
    VCareerPermission.CompanyVerification.ApproveCompany,
    VCareerPermission.CompanyVerification.RejectCompany,
    VCareerPermission.CompanyVerification.ViewVerifiedCompanies,
    VCareerPermission.CompanyVerification.ViewRejectedCompanies,
    VCareerPermission.CompanyVerification.DownloadLegalDocument
};

        #endregion

    }
}
