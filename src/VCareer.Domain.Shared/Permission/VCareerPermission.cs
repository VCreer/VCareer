using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Permission
{
    public class VCareerPermission
    {
        public const string GroupName = "VCareer";
        public static class Files
        {
            public const string Default = GroupName + ".Files";
            public const string View   = Default + ".View";
            public const string Upload = Default + ".Upload";
            public const string Download = Default + ".Download";
            public const string Delete = Default + ".Delete";
            public const string Update = Default + ".Update";
        }

        public static class Profile
        {
            public const string Default = GroupName + ".Profile";
            public const string UpdatePersonalInfo = Default + ".UpdatePersonalInfo";
            public const string ChangePassword = Default + ".ChangePassword";
            public const string DeleteAccount = Default + ".DeleteAccount";
            public const string SubmitLegalInformation = Default + ".SubmitLegalInformation";
            public const string UpdateLegalInformation = Default + ".UpdateLegalInformation";
            public const string UploadSupportingDocument = Default + ".UploadSupportingDocument";
            public const string UpdateSupportingDocument = Default + ".UpdateSupportingDocument";
            public const string DeleteSupportingDocument = Default + ".DeleteSupportingDocument";
            public const string DownloadSupportingDocument = Default + ".DownloadSupportingDocument";
        }

        public static class CV
        {
            public const string Default = GroupName + ".CV";
            public const string CreateOnline = Default + ".CreateOnline";
            public const string Upload = Default + ".Upload";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
            public const string Get = Default + ".Get";
            public const string SetDefault = Default + ".SetDefault";
            public const string SetPublic = Default + ".SetPublic";
        }

        public static class Dashboard
        {
            public const string Default = GroupName + ".Dashboard";
            public const string ViewCompanyDashboard = Default + ".ViewCompanyDashboard";
            public const string ViewStaffPerformance = Default + ".ViewStaffPerformance";
            public const string ViewActivityTrend = Default + ".ViewActivityTrend";
            public const string ViewTopPerformers = Default + ".ViewTopPerformers";
            public const string CompareStaffPerformance = Default + ".CompareStaffPerformance";
        }
    }
}
