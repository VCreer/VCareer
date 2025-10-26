using Volo.Abp.Authorization.Permissions;

namespace VCareer.Application.Contracts.Permissions
{
    /// <summary>
    /// Định nghĩa permissions cho VCareer
    /// </summary>
    public static class VCareerPermissions
    {
        public const string GroupName = "VCareer";

        /// <summary>
        /// CV Management Permissions
        /// </summary>
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

        /// <summary>
        /// Application Management Permissions
        /// </summary>
        public static class Application
        {
            public const string Default = GroupName + ".Application";
            public const string Apply = Default + ".Apply";
            public const string View = Default + ".View";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
            public const string Manage = Default + ".Manage"; // Cho nhà tuyển dụng
            public const string Statistics = Default + ".Statistics";
            public const string DownloadCV = Default + ".DownloadCV";
            public const string Withdraw = Default + ".Withdraw";
        }

        /// <summary>
        /// Profile Management Permissions
        /// </summary>
        public static class Profile
        {
            public const string Default = GroupName + ".Profile";
            public const string View = Default + ".View";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
        }
    }
}

