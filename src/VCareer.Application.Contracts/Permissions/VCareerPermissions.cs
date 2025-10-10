namespace VCareer.Permissions;

public static class VCareerPermissions
{
    public const string GroupName = "VCareer";


    public static class Books
    {
        public const string Default = GroupName + ".Books";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
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
    
    //Add your own permission names. Example:
    //public const string MyPermission1 = GroupName + ".MyPermission1";
}
