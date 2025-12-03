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
            public const string View = Default + ".View";
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

        public static class CvTemplate
        {
            public const string Default = GroupName + ".CvTemplate";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
            public const string Get = Default + ".Get";
            public const string GetList = Default + ".GetList";
            public const string GetActiveTemplates = Default + ".GetActiveTemplates";
        }

        public static class CandidateCv
        {
            public const string Default = GroupName + ".CandidateCv";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
            public const string Get = Default + ".Get";
            public const string GetList = Default + ".GetList";
            public const string Render = Default + ".Render";
            public const string SetDefault = Default + ".SetDefault";
            public const string Publish = Default + ".Publish";
            public const string IncrementViewCount = Default + ".IncrementViewCount";
            public const string GetDefault = Default + ".GetDefault";
        }


        public static class Cart
        {
            public const string Default = GroupName + ".Cart";
            public const string Create = Default + ".AddtoCart";
            public const string Update = Default + ".UpdateCart";
            public const string Delete = Default + ".DeleteCart";
            public const string GetList = Default + ".GetList";
          
        }




        //public static class Dashboard
        //{
        //    public const string Default = GroupName + ".Dashboard";
        //    public const string ViewCompanyDashboard = Default + ".ViewCompanyDashboard";
        //    public const string ViewStaffPerformance = Default + ".ViewStaffPerformance";
        //    public const string ViewActivityTrend = Default + ".ViewActivityTrend";
        //    public const string ViewTopPerformers = Default + ".ViewTopPerformers";
        //    public const string CompareStaffPerformance = Default + ".CompareStaffPerformance";
        //}

        public static class Application
        {
            public const string Default = GroupName + ".Application";
            public const string Apply = Default + ".Apply";
            public const string View = Default + ".View";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
            public const string Manage = Default + ".Manage";
            public const string Statistics = Default + ".Statistics";
            public const string DownloadCV = Default + ".DownloadCV";
            public const string Withdraw = Default + ".Withdraw";
        }

        
    }
}
