using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Constants.FilePolicy
{
    public class FilePolicyConfigs
    {
        public CandidateFileConfig Candidate { get; set; }
        public RecruiterFileConfig Recruiter { get; set; }
        public EmployeeFileConfig Employee { get; set; }
        public SystemFileConfig System { get; set; }
        public int ChunkSizeMB { get; set; }
    }

    public class ContainerConfig
    {
        public string Path { get; set; }
        public string[] AllowedExtensions { get; set; }
        public int MaxSizeMB { get; set; }
    }

    #region Candidate / Recruiter / Employee configs

    public class CandidateFileConfig
    {
        public Dictionary<string, ContainerConfig> Containers { get; set; }
        public int UserQuotaMB { get; set; }
    }

    public class RecruiterFileConfig
    {
        public Dictionary<string, ContainerConfig> Containers { get; set; }
        public int UserQuotaMB { get; set; }
    }

    public class EmployeeFileConfig
    {
        public Dictionary<string, ContainerConfig> Containers { get; set; }
        public int UserQuotaMB { get; set; }
    }

    public class SystemFileConfig
    {
        public ContainerConfig ExportReports { get; set; }
        public ContainerConfig TempUploads { get; set; }
    }

    #endregion


    #region Enums for strongly-typed container access

    public enum CandidateContainerType
    {
        Resumes,
        Attachments,
        Avatars
    }

    public enum RecruiterContainerType
    {
        CompanyDocuments,
        CompanyLogos,
        Contracts
    }

    public enum EmployeeContainerType
    {
        ProfilePictures,
        Documents
    }

    public enum SystemContainerType
    {
        ExportReports,
        TempUploads
    }

    #endregion
}


